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
