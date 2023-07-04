const { ActivityHandler, CardFactory, MemoryStorage, ConversationState } = require('botbuilder');
const axios = require('axios');

class MyBot extends ActivityHandler {
    constructor() {
        super();

        const conversationState = new ConversationState(new MemoryStorage());
        this.conversationState = conversationState.createProperty('conversationState');

        this.onMembersAdded(async (context, next) => {
            for (const member of context.activity.membersAdded) {
                if (member.id === context.activity.recipient.id) {
                    const conversationData = await this.conversationState.get(context, {});

                    if (conversationData.authenticated) {
                        await this.displayMainMenu(context);
                    } else {
                        // Prompt the user to input their name
                        await context.sendActivity('Please enter your name:');
                    }
                }
            }
            await next();
        });

        this.onMessage(async (context, next) => {
            const text = context.activity.text;
            const conversationData = await this.conversationState.get(context, {});

            if (!conversationData.name) {
                // If name is not set, store the provided name
                conversationData.name = text;

                // Prompt the user to input their email address
                await context.sendActivity('Please enter your email address:');
            } else if (!conversationData.email) {
                // If email is not set, store the provided email
                conversationData.email = text;

                // Display the name and email address
                await context.sendActivity(`Name: ${conversationData.name}`);
                await context.sendActivity(`Email: ${conversationData.email}`);

                // Prompt the user to input the authentication code
                await context.sendActivity('Please enter the authentication code:');
            } else if (!conversationData.authenticated) {
                // If not authenticated, check the authentication code
                if (text === '11223344') {
                    // Successful authentication
                    conversationData.authenticated = true;

                    await context.sendActivity('Authentication successful!');
                    await this.displayMainMenu(context);
                } else {
                    // Failed authentication
                    await context.sendActivity('Invalid authentication code. Please try again:');
                }
            } else {
                // Authenticated, handle user prompts
                if (!['Hi', 'Hello', 'Bye', 'No', 'Yes'].includes(text)) {
                    // Send the prompt to the API and display the response
                    const response = await this.callApi(text);
                    await context.sendActivity(response);
                }
            }

            await this.conversationState.set(context, conversationData); // Save conversation state
            await conversationState.saveChanges(context); // Persist changes

            await next();
        });
    }

    async displayMainMenu(context) {
        const adaptiveCard = CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'TextBlock',
                    text: 'Welcome to the Main Menu!',
                    size: 'Large',
                    weight: 'Bolder'
                }
            ],
            actions: [
                { type: 'Action.Submit', title: 'Prompt 1', data: 'prompt1' },
                { type: 'Action.Submit', title: 'Prompt 2', data: 'prompt2' },
                { type: 'Action.Submit', title: 'Prompt 3', data: 'prompt3' }
            ]
        });

        const cardMessage = { type: 'message', attachments: [adaptiveCard] };
        await context.sendActivity(cardMessage);
    }

    async callApi(prompt) {
        try {
            const response = await axios.post('https://developer.themoviedb.org /3/search/movie', {
                prompt: prompt
            });

            return response.data;
        } catch (error) {
            console.error('API error:', error);
            return 'An error occurred while processing your request. Please try again later.';
        }
    }
}

module.exports.MyBot = MyBot;
