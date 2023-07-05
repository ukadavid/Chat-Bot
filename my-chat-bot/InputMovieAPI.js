const { ActivityHandler, CardFactory, MemoryStorage, ConversationState } = require('botbuilder');
const validateEmailAddresses = require('./validateEmails');
const axios = require('axios');
const MovieAPIKey = process.env.MovieAPI;
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
                // If email is not set, validate and store the provided email
                const isValidEmail = await validateEmailAddresses(text);

                if (isValidEmail) {
                    conversationData.email = text;

                    // Display the name and email address
                    await context.sendActivity(`Name: ${ conversationData.name }`);
                    await context.sendActivity(`Email: ${ conversationData.email }`);

                    // Prompt the user to input the authentication code
                    await context.sendActivity('Please enter the authentication code:');
                } else {
                    await context.sendActivity('Invalid email address. Please try again:');
                }
            } else if (!conversationData.authenticated) {
                // If not authenticated, check the authentication code
                if (text === '11223344') {
                    // Successful authentication
                    conversationData.authenticated = true;

                    await context.sendActivity('Authentication successful!');
                    await this.displayKeywordMenu(context);
                } else {
                    // Failed authentication
                    await context.sendActivity('Invalid authentication code. Please try again:');
                }
            } else {
                // Authenticated, handle main menu options
                const keywordSelection = context.activity.value?.title?.toLowerCase();

                if (keywordSelection) {
                    await this.handleRestrictedKeyword(context, keywordSelection);
                } else {
                    await this.sendToAPIAndDisplayResponse(context, text);
                }
            }

            await this.conversationState.set(context, conversationData); // Save conversation state
            await conversationState.saveChanges(context); // Persist changes

            await next();
        });
    }

    async displayKeywordMenu(context) {
        // Create an Adaptive Card instance
        const adaptiveCard = {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
                {
                    type: 'Image',
                    url: 'http://adaptivecards.io/content/adaptive-card-50.png',
                    size: 'Medium'
                },
                {
                    type: 'TextBlock',
                    text: '**Keywords**',
                    weight: 'Bolder',
                    size: 'Medium',
                    horizontalAlignment: 'Center'
                }
            ],
            actions: [
                { type: 'Action.Submit', title: 'Hi', data: { title: 'hi' } },
                { type: 'Action.Submit', title: 'Hello', data: { title: 'hello' } },
                { type: 'Action.Submit', title: 'Bye', data: { title: 'bye' } },
                { type: 'Action.Submit', title: 'No', data: { title: 'no' } },
                { type: 'Action.Submit', title: 'Yes', data: { title: 'yes' } }
            ]
        };

        // Render the adaptive card and send it as a reply
        const cardMessage = CardFactory.adaptiveCard(adaptiveCard);
        await context.sendActivity({ attachments: [cardMessage] });
    }

    async handleRestrictedKeyword(context, keyword) {
        switch (keyword) {
        case 'hi':
        case 'hello':
            await context.sendActivity('Hello! How can I assist you?');
            break;
        case 'bye':
            await context.sendActivity('Goodbye! Have a great day!');
            break;
        case 'no':
        case 'yes':
            await context.sendActivity('Please provide more information or ask a specific question.');
            break;
        }
    }

    async sendToAPIAndDisplayResponse(context, text) {
        // TODO: Call the API with the user's text and get the response
        const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
            params: {
                api_key: `${ MovieAPIKey }`,
                query: text
            }
        });
        const movies = response.data.results.slice(0, 1);

        for (const movie of movies) {
            const card = CardFactory.heroCard(
                movie.title,
                movie.overview,
                [{ url: `https://image.tmdb.org/t/p/w500${ movie.poster_path }` }],
                [
                    { type: 'openUrl', title: 'View Details', value: `https://www.themoviedb.org/movie/${ movie.id }` }
                ]
            );

            const cardMessage = { type: 'message', attachments: [card] };
            await context.sendActivity(cardMessage);
        }
    }
}

module.exports.MyBot = MyBot;
