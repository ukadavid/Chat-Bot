// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityHandler, MessageFactory, MemoryStorage, ConversationState } = require('botbuilder');

class EmailBot extends ActivityHandler {
    constructor() {
        super();

        // Create conversation state property accessor
        const conversationState = new ConversationState(new MemoryStorage());
        this.conversationState = conversationState.createProperty('conversationState');

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome! Please provide your email address:';

            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }

            await next();
        });

        this.onMessage(async (context, next) => {
            const text = context.activity.text;

            if (context.activity.channelData && context.activity.channelData.postBack) {
                // Ignore postback activities
                await next();
                return;
            }

            const conversationData = await this.conversationState.get(context, {});
            if (!conversationData.email) {
                // If email is not set, validate and store the provided email
                if (isValidEmail(text)) {
                    conversationData.email = text;
                    await context.sendActivity('Logged in successfully!');
                } else {
                    // Show typing indicator before sending the error message
                    await context.sendActivity({ type: 'typing' });
                    await context.sendActivity('Incorrect email format. Please enter a valid email address:');
                }
            } else {
                // Email is already set, handle other messages here if needed
                await context.sendActivity('You are already logged in.');
            }

            await this.conversationState.set(context, conversationData); // Save conversation state
            await conversationState.saveChanges(context); // Persist changes

            await next();
        });
    }
}

function isValidEmail(email) {
    // Simple email validation using a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports.EmailBot = EmailBot;

class MessageSchedulerBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context) => {
            const text = context.activity.text;

            // Check if the user wants to schedule a message
            if (text.toLowerCase().startsWith('schedule')) {
                // Extract the scheduled time and message content
                const parts = text.split(' ');
                const scheduledTime = parts[1];
                const messageContent = parts.slice(2).join(' ');

                // Schedule the message
                await this.scheduleMessage(context, scheduledTime, messageContent);
            } else {
                await context.sendActivity('Please enter "schedule [time] [message]" to schedule a message.');
            }
        });
    }

    async scheduleMessage(context, scheduledTime, messageContent) {
        // Calculate the delay in milliseconds until the scheduled time
        const now = new Date();
        const scheduledDate = new Date(scheduledTime);
        const delay = scheduledDate - now;

        if (delay <= 0) {
            await context.sendActivity('The scheduled time must be in the future.');
        } else {
            // Immediate response upon scheduling
            await context.sendActivity('I will remind you by the scheduled time you inputted.');

            await this.delay(delay);

            // Send the scheduled message
            await context.sendActivity(`It's time! You scheduled a message with the content: ${ messageContent }`);
        }
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

module.exports.MessageSchedulerBot = MessageSchedulerBot;
