// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityHandler, ActionTypes, MessageFactory, CardFactory, MemoryStorage, ConversationState } = require('botbuilder');

class EmailBot extends ActivityHandler {
    constructor() {
        super();

        // Create conversation state property accessor
        const conversationState = new ConversationState(new MemoryStorage());
        this.conversationState = conversationState.createProperty('conversationState');

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome! Do you want to input your email?');
                    await this.displayYesNoOptions(context);
                }
            }

            await next();
        });

        this.onMessage(async (context, next) => {
            const text = context.activity.text;
            const conversationData = await this.conversationState.get(context, {});
            const response = ['Yes', 'No'];

            if (response.includes(text)) {
                if (text === 'Yes' || text === 'Y') {
                    await context.sendActivity('Please enter your email:');
                } else if (text === 'No' || text === 'N') {
                    await context.sendActivity('Thank you for your response, Goodbye!');
                    await context.sendActivity({ type: 'endOfConversation' });
                    return;
                }
            } else if (!conversationData.email) {
                // If email is not set, validate and store the provided email
                if (isValidEmail(text)) {
                    conversationData.email = text;
                    await context.sendActivity('Logged in successfully!');
                    // Send the options card to the user
                    await this.displayOptions(context);
                } else {
                    // Show typing indicator before sending the error message
                    await context.sendActivity({ type: 'typing' });
                    await context.sendActivity('Incorrect email format. Please enter a valid email address:');
                }
            } else {
                // Email is already set, handle other messages here if needed
                if (text === '1') {
                    delete conversationData.email;
                    await context.sendActivity('You have successfully logged out.');
                    await context.sendActivity({ type: 'endOfConversation' });
                    return;
                } else if (text === '2') {
                    const email = conversationData.email;
                    const username = email.slice(0, email.indexOf('@'));
                    await context.sendActivity(`Welcome to the dashboard, ${ username }@`);
                } else if (text === '3') {
                    const attachment = this.getInternetAttachment();
                    const reply = MessageFactory.attachment(attachment);
                    await context.sendActivity(reply);
                    await context.sendActivity({ type: 'endOfConversation' });
                    return;
                } else {
                    await context.sendActivity('Invalid option. Please select a valid option.');
                }
            }

            await this.conversationState.set(context, conversationData); // Save conversation state
            await conversationState.saveChanges(context); // Persist changes

            await next();
        });
    }

    async displayYesNoOptions(context) {
        const cardActions = [
            {
                type: ActionTypes.ImBack,
                title: 'Yes',
                value: 'Yes',
                style: 'positive', // Add this property for styling
                image: 'https://cdn-icons-png.flaticon.com/512/6051/6051493.png', // Add an image for the button
                imageAltText: 'Yes'// Alt text for the image
            },
            {
                type: ActionTypes.ImBack,
                title: 'No',
                value: 'No',
                style: 'negative', // Add this property for styling
                image: 'https://www.counselmagazine.co.uk/images/uploadedfiles/2897df9f91d167a042c7a1058355e238561e.png?sfvrsn=c5df5f0a_3', // Add an image for the button
                imageAltText: 'No' // Alt text for the image
            }
        ];
        const reply = MessageFactory.suggestedActions(cardActions, 'Do you want to input your email?');
        await context.sendActivity(reply);
    }

    async displayOptions(context) {
        const reply = MessageFactory.attachment(
            CardFactory.heroCard(
                'Options',
                undefined,
                [
                    { type: ActionTypes.ImBack, title: '1. Logout', value: '1' },
                    { type: ActionTypes.ImBack, title: '2. Enter Dashboard', value: '2' },
                    { type: ActionTypes.ImBack, title: '3. Finish', value: '3' }
                ],
                { text: 'Well done, it took you a great deal to be here' }
            )
        );

        await context.sendActivity(reply);
    }

    getInternetAttachment() {
        return {
            name: 'architecture-resize.png',
            contentType: 'image/png',
            contentUrl: 'https://d1v7g7y4y70yfq.cloudfront.net/02-Blog/Main-Blog-Illustrations/blog-2020-04-07-how_to_say_thank_you_in_business.png'
        };
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

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity("Hello! I am a scheduling bot. You can schedule messages by using the 'schedule' command.");
                }
            }

            await next();
        });

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
                await context.sendActivity('Please enter "schedule [DDDD-MM-DDTHH:MM:SS] [message]" to schedule a message.');
            }
        });
    }

    async scheduleMessage(context, scheduledTime, messageContent) {
        // Calculate the delay in milliseconds until the scheduled time
        const now = new Date();
        const scheduledDate = new Date(scheduledTime);
        const delay = scheduledDate - now;

        if (delay <= 0) {
            await context.sendActivity('Please set a future date and time for scheduling.');
        } else {
            // Immediate response upon scheduling
            const scheduledTimeWithoutDate = scheduledTime.split('T')[1].substring(0, 5);
            await context.sendActivity(`I will remind you by the scheduled time you inputted: ${ scheduledTimeWithoutDate }`);

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
