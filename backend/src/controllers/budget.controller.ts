// src/controllers/budget.controller.ts

import { Request, Response } from 'express';
import { Group } from '../models/group.model';
import { Expense } from '../models/expense.model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import notificationService from '../services/notification.service';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface BudgetSuggestion {
  name: string;
  amount: number;
  reason: string;
}

class BudgetController {

  // Get AI budget suggestions based on user description
  getBudgetSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { description, groupId } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!description) {
        res.status(400).json({ error: 'Description is required' });
        return;
      }

      // Verify group membership
      const group = await Group.findById(groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      const isMember = group.members.some((member: any) => 
        member.userId.toString() === userId.toString()
      );

      if (!isMember) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Prepare AI prompt
      const prompt = `
        Based on the user's plan: "${description}", suggest three budget tiers for the total group cost.
        
        Respond with a JSON object containing an array called "suggestions" with three budget options:
        - "saver": A budget-conscious option
        - "comfort": A balanced, moderate option  
        - "luxury": A premium, high-end option
        
        Each suggestion should have:
        - "name": The tier name (e.g., "Saver Plan", "Comfort Plan", "Luxury Plan")
        - "amount": The suggested total amount as a number (in USD)
        - "reason": A brief one-sentence explanation
        
        Consider factors like group size, location, duration, and activity type.
        Make amounts realistic and varied between tiers.
        
        Example format:
        {
          "suggestions": [
            {"name": "Saver Plan", "amount": 2000, "reason": "Budget-friendly option focusing on essentials."},
            {"name": "Comfort Plan", "amount": 3500, "reason": "Good balance of comfort and value."},
            {"name": "Luxury Plan", "amount": 6000, "reason": "Premium experience with top-tier accommodations."}
          ]
        }
      `;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        // Parse AI response
        const aiResponse = JSON.parse(responseText);
        
        if (aiResponse.suggestions && Array.isArray(aiResponse.suggestions)) {
          res.json({
            success: true,
            suggestions: aiResponse.suggestions,
            description: description
          });
        } else {
          throw new Error('Invalid AI response format');
        }

      } catch (parseError) {
        // Fallback with default suggestions if AI parsing fails
        console.error('Error parsing AI response:', parseError);
        
        const fallbackSuggestions: BudgetSuggestion[] = [
          {
            name: "Saver Plan",
            amount: 1500,
            reason: "Budget-friendly option focusing on essentials."
          },
          {
            name: "Comfort Plan", 
            amount: 3000,
            reason: "Good balance of comfort and value."
          },
          {
            name: "Luxury Plan",
            amount: 5500,
            reason: "Premium experience with top-tier options."
          }
        ];

        res.json({
          success: true,
          suggestions: fallbackSuggestions,
          description: description,
          fallback: true
        });
      }

    } catch (error) {
      console.error('Error getting budget suggestions:', error);
      res.status(500).json({ error: 'Failed to get budget suggestions' });
    }
  }

  // Set group budget
  setGroupBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const { amount, currency = 'USD', description } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Valid budget amount is required' });
        return;
      }

      // Find and update group
      const group = await Group.findById(groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Check if user is admin or member
      const memberInfo = group.members.find((member: any) => 
        member.userId.toString() === userId.toString()
      );

      if (!memberInfo) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Update group budget
      group.budget = {
        totalAmount: amount,
        currency: currency,
        description: description,
        setBy: userId,
        setAt: new Date()
      };

      await group.save();

      // Send notification to all group members
      const memberIds = group.members.map((member: any) => member.userId.toString());
      await notificationService.sendGroupNotification(
        memberIds,
        `💰 Budget Set for ${group.name}`,
        `Budget of $${amount} has been set for the group.`,
        {
          type: 'budget_set',
          groupId: groupId,
          amount: amount,
          currency: currency
        }
      );

      res.json({
        success: true,
        message: 'Group budget set successfully',
        budget: {
          amount: amount,
          currency: currency,
          description: description
        }
      });

    } catch (error) {
      console.error('Error setting group budget:', error);
      res.status(500).json({ error: 'Failed to set group budget' });
    }
  }

  // Get group budget and spending summary
  getGroupBudgetStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const userId = req.user?.id || req.user?._id;

      // Find group
      const group = await Group.findById(groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Check membership
      const isMember = group.members.some((member: any) => 
        member.userId.toString() === userId.toString()
      );

      if (!isMember) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Calculate total spending
      const expenses = await Expense.find({ groupId: groupId });
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      let budgetStatus = null;
      if (group.budget) {
        const percentage = (totalSpent / group.budget.totalAmount) * 100;
        
        budgetStatus = {
          totalBudget: group.budget.totalAmount,
          currency: group.budget.currency,
          description: group.budget.description,
          totalSpent: totalSpent,
          remaining: group.budget.totalAmount - totalSpent,
          percentage: Math.round(percentage * 100) / 100,
          status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'warning' : percentage >= 50 ? 'halfway' : 'good'
        };

        // Check if we should send budget alerts
        await this.checkAndSendBudgetAlerts(group, totalSpent, percentage);
      }

      res.json({
        success: true,
        groupName: group.name,
        budgetStatus: budgetStatus,
        recentExpenses: expenses.slice(-5).map(expense => ({
          title: expense.title,
          amount: expense.amount,
          date: expense.date
        }))
      });

    } catch (error) {
      console.error('Error getting budget status:', error);
      res.status(500).json({ error: 'Failed to get budget status' });
    }
  }

  // Check and send budget alerts if needed
  private checkAndSendBudgetAlerts = async (group: any, totalSpent: number, percentage: number): Promise<void> => {
    try {
      if (!group.budget) return;

      const lastAlert = group.budget.lastAlertSent;
      const shouldSendAlert = !lastAlert || 
        (percentage >= 100 && (!lastAlert || lastAlert.percentage < 100)) ||
        (percentage >= 90 && (!lastAlert || lastAlert.percentage < 90)) ||
        (percentage >= 50 && (!lastAlert || lastAlert.percentage < 50));

      if (shouldSendAlert) {
        const groupMembers = group.members.map((member: any) => ({
          userId: member.userId.toString(),
          userName: member.userId.fullName || 'Member'
        }));

        await notificationService.sendBudgetAlert(
          groupMembers,
          group.name,
          totalSpent,
          group.budget.totalAmount,
          percentage
        );

        // Update last alert sent
        group.budget.lastAlertSent = {
          percentage: Math.floor(percentage / 10) * 10, // Round to nearest 10%
          sentAt: new Date()
        };

        await group.save();
      }

    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }

  // Remove group budget
  removeGroupBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const userId = req.user?.id || req.user?._id;

      const group = await Group.findById(groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Check if user is admin
      const memberInfo = group.members.find((member: any) => 
        member.userId.toString() === userId.toString()
      );

      if (!memberInfo || memberInfo.role !== 'admin') {
        res.status(403).json({ error: 'Only group admins can remove budget' });
        return;
      }

      group.budget = undefined;
      await group.save();

      res.json({
        success: true,
        message: 'Group budget removed successfully'
      });

    } catch (error) {
      console.error('Error removing group budget:', error);
      res.status(500).json({ error: 'Failed to remove group budget' });
    }
  }
}

export default new BudgetController();
