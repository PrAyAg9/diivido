"use strict";
// src/services/notification.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
const expo_server_sdk_1 = require("expo-server-sdk");
const user_model_1 = require("../models/user.model");
class NotificationService {
    constructor() {
        this.expo = new expo_server_sdk_1.Expo();
    }
    // Send Quick Draw game notifications to group members
    async sendQuickDrawNotifications(participants, expenseTitle, gameId) {
        try {
            const messages = [];
            for (const participant of participants) {
                const user = await user_model_1.User.findById(participant.userId);
                if (user && user.expoPushToken && expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken)) {
                    messages.push({
                        to: user.expoPushToken,
                        sound: 'default',
                        title: '⚡ Quick Draw Challenge!',
                        body: `Who will pay for "${expenseTitle}"? Tap to play!`,
                        data: {
                            type: 'quickdraw',
                            gameId: gameId,
                            expenseTitle: expenseTitle
                        },
                        priority: 'high',
                        channelId: 'quickdraw'
                    });
                }
            }
            if (messages.length > 0) {
                const chunks = this.expo.chunkPushNotifications(messages);
                for (const chunk of chunks) {
                    try {
                        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                        console.log('📱 Quick Draw notifications sent:', ticketChunk);
                    }
                    catch (error) {
                        console.error('Error sending notification chunk:', error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error sending Quick Draw notifications:', error);
        }
    }
    // Send budget alert notifications
    async sendBudgetAlert(groupMembers, groupName, currentSpent, totalBudget, percentage) {
        try {
            const messages = [];
            let alertMessage = '';
            let alertTitle = '';
            if (percentage >= 100) {
                alertTitle = '🚨 Budget Exceeded!';
                alertMessage = `${groupName}: We've exceeded our budget of $${totalBudget}! Currently spent: $${currentSpent}`;
            }
            else if (percentage >= 90) {
                alertTitle = '⚠️ Budget Alert - 90%';
                alertMessage = `${groupName}: We've used 90% of our $${totalBudget} budget. Let's be mindful! 📈`;
            }
            else if (percentage >= 50) {
                alertTitle = '📊 Budget Update - 50%';
                alertMessage = `${groupName}: We're halfway through our $${totalBudget} budget! Just a friendly heads-up.`;
            }
            for (const member of groupMembers) {
                const user = await user_model_1.User.findById(member.userId);
                if (user && user.expoPushToken && expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken)) {
                    messages.push({
                        to: user.expoPushToken,
                        sound: 'default',
                        title: alertTitle,
                        body: alertMessage,
                        data: {
                            type: 'budget_alert',
                            groupName: groupName,
                            currentSpent: currentSpent,
                            totalBudget: totalBudget,
                            percentage: percentage
                        },
                        priority: 'normal',
                        channelId: 'budget'
                    });
                }
            }
            if (messages.length > 0) {
                const chunks = this.expo.chunkPushNotifications(messages);
                for (const chunk of chunks) {
                    try {
                        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                        console.log('📊 Budget alert notifications sent:', ticketChunk);
                    }
                    catch (error) {
                        console.error('Error sending budget alert chunk:', error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error sending budget alert notifications:', error);
        }
    }
    // Send general group notifications
    async sendGroupNotification(userIds, title, body, data) {
        try {
            const messages = [];
            for (const userId of userIds) {
                const user = await user_model_1.User.findById(userId);
                if (user && user.expoPushToken && expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken)) {
                    messages.push({
                        to: user.expoPushToken,
                        sound: 'default',
                        title: title,
                        body: body,
                        data: data || {},
                        priority: 'normal'
                    });
                }
            }
            if (messages.length > 0) {
                const chunks = this.expo.chunkPushNotifications(messages);
                for (const chunk of chunks) {
                    try {
                        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                        console.log('📱 Group notifications sent:', ticketChunk);
                    }
                    catch (error) {
                        console.error('Error sending notification chunk:', error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error sending group notifications:', error);
        }
    }
    // Register user's push token
    async registerPushToken(userId, pushToken) {
        try {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                return;
            }
            await user_model_1.User.findByIdAndUpdate(userId, { expoPushToken: pushToken });
            console.log(`✅ Registered push token for user ${userId}`);
        }
        catch (error) {
            console.error('Error registering push token:', error);
        }
    }
}
exports.default = new NotificationService();
