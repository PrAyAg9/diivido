"use strict";
// src/controllers/budget.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const group_model_1 = require("../models/group.model");
const expense_model_1 = require("../models/expense.model");
const generative_ai_1 = require("@google/generative-ai");
const notification_service_1 = __importDefault(require("../services/notification.service"));
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
class BudgetController {
    constructor() {
        // Get AI budget suggestions based on user description
        this.getBudgetSuggestions = async (req, res) => {
            var _a, _b;
            try {
                const { description, groupId } = req.body;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!description) {
                    res.status(400).json({ error: 'Description is required' });
                    return;
                }
                // Verify group membership
                const group = await group_model_1.Group.findById(groupId);
                if (!group) {
                    res.status(404).json({ error: 'Group not found' });
                    return;
                }
                const isMember = group.members.some((member) => member.userId.toString() === userId.toString());
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
                    }
                    else {
                        throw new Error('Invalid AI response format');
                    }
                }
                catch (parseError) {
                    // Fallback with default suggestions if AI parsing fails
                    console.error('Error parsing AI response:', parseError);
                    const fallbackSuggestions = [
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
            }
            catch (error) {
                console.error('Error getting budget suggestions:', error);
                res.status(500).json({ error: 'Failed to get budget suggestions' });
            }
        };
        // Set group budget
        this.setGroupBudget = async (req, res) => {
            var _a, _b;
            try {
                const { groupId } = req.params;
                const { amount, currency = 'USD', description } = req.body;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!amount || amount <= 0) {
                    res.status(400).json({ error: 'Valid budget amount is required' });
                    return;
                }
                // Find and update group
                const group = await group_model_1.Group.findById(groupId);
                if (!group) {
                    res.status(404).json({ error: 'Group not found' });
                    return;
                }
                // Check if user is admin or member
                const memberInfo = group.members.find((member) => member.userId.toString() === userId.toString());
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
                const memberIds = group.members.map((member) => member.userId.toString());
                await notification_service_1.default.sendGroupNotification(memberIds, `💰 Budget Set for ${group.name}`, `Budget of $${amount} has been set for the group.`, {
                    type: 'budget_set',
                    groupId: groupId,
                    amount: amount,
                    currency: currency
                });
                res.json({
                    success: true,
                    message: 'Group budget set successfully',
                    budget: {
                        amount: amount,
                        currency: currency,
                        description: description
                    }
                });
            }
            catch (error) {
                console.error('Error setting group budget:', error);
                res.status(500).json({ error: 'Failed to set group budget' });
            }
        };
        // Get group budget and spending summary
        this.getGroupBudgetStatus = async (req, res) => {
            var _a, _b;
            try {
                const { groupId } = req.params;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                // Find group
                const group = await group_model_1.Group.findById(groupId);
                if (!group) {
                    res.status(404).json({ error: 'Group not found' });
                    return;
                }
                // Check membership
                const isMember = group.members.some((member) => member.userId.toString() === userId.toString());
                if (!isMember) {
                    res.status(403).json({ error: 'Not a member of this group' });
                    return;
                }
                // Calculate total spending
                const expenses = await expense_model_1.Expense.find({ groupId: groupId });
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
            }
            catch (error) {
                console.error('Error getting budget status:', error);
                res.status(500).json({ error: 'Failed to get budget status' });
            }
        };
        // Check and send budget alerts if needed
        this.checkAndSendBudgetAlerts = async (group, totalSpent, percentage) => {
            try {
                if (!group.budget)
                    return;
                const lastAlert = group.budget.lastAlertSent;
                const shouldSendAlert = !lastAlert ||
                    (percentage >= 100 && (!lastAlert || lastAlert.percentage < 100)) ||
                    (percentage >= 90 && (!lastAlert || lastAlert.percentage < 90)) ||
                    (percentage >= 50 && (!lastAlert || lastAlert.percentage < 50));
                if (shouldSendAlert) {
                    const groupMembers = group.members.map((member) => ({
                        userId: member.userId.toString(),
                        userName: member.userId.fullName || 'Member'
                    }));
                    await notification_service_1.default.sendBudgetAlert(groupMembers, group.name, totalSpent, group.budget.totalAmount, percentage);
                    // Update last alert sent
                    group.budget.lastAlertSent = {
                        percentage: Math.floor(percentage / 10) * 10, // Round to nearest 10%
                        sentAt: new Date()
                    };
                    await group.save();
                }
            }
            catch (error) {
                console.error('Error checking budget alerts:', error);
            }
        };
        // Remove group budget
        this.removeGroupBudget = async (req, res) => {
            var _a, _b;
            try {
                const { groupId } = req.params;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                const group = await group_model_1.Group.findById(groupId);
                if (!group) {
                    res.status(404).json({ error: 'Group not found' });
                    return;
                }
                // Check if user is admin
                const memberInfo = group.members.find((member) => member.userId.toString() === userId.toString());
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
            }
            catch (error) {
                console.error('Error removing group budget:', error);
                res.status(500).json({ error: 'Failed to remove group budget' });
            }
        };
    }
}
exports.default = new BudgetController();
