const { ActivityHandler, CardFactory, MemoryStorage, ConversationState } = require('botbuilder');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const MovieAPIKey = process.env.MovieAPI;
const url = process.env.url;
const specificMovieURL = process.env.specificMovieURL;
const movieURL = process.env.movieURL;

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
                conversationData.email = text;

                // Display the name and email address
                await context.sendActivity(`Name: ${ conversationData.name }`);
                await context.sendActivity(`Email: ${ conversationData.email }`);

                // Prompt the user to input the authentication code
                await context.sendActivity('Please enter the authentication code:');
            } else if (!conversationData.authenticated) {
                // If not authenticated, check the authentication code
                if (text === '11223344') {
                    // Successful authentication
                    conversationData.authenticated = true;

                    await context.sendActivity('Authentication successful!');
                    await this.displayTrendingMovies(context);
                } else {
                    // Failed authentication
                    await context.sendActivity('Invalid authentication code. Please try again:');
                }
            } else {
                // Authenticated, handle main menu options
                if (text.toLowerCase() === 'search') {
                    conversationData.searching = true;
                    await context.sendActivity('Please enter the movie title you want to search:');
                } else if (conversationData.searching) {
                    await this.searchMovies(context, text);
                    conversationData.searching = false;
                } else {
                    await context.sendActivity('Invalid option. Please select a valid option or enter "search" to search for a movie:');
                }
            }

            await this.conversationState.set(context, conversationData); // Save conversation state
            await conversationState.saveChanges(context); // Persist changes

            await next();
        });
    }

    async displayMainMenu(context) {
        const card = CardFactory.heroCard(
            'Main menu',
            'Welcome to XYZ, what can I do for you today?',
            null,
            [
                { type: 'imBack', title: 'Search for a Movie', value: 'search' }
            ]
        );

        const cardMessage = { type: 'message', attachments: [card] };
        await context.sendActivity(cardMessage);
    }

    async displayTrendingMovies(context) {
        const response = await axios.get(`${ url }trending/movie/day`, {
            params: {
                api_key: `${ MovieAPIKey }`
            }
        });

        const movies = response.data.results.slice(0, 10);

        const carouselAttachments = movies.map(movie => {
            return {
                contentType: 'application/vnd.microsoft.card.hero',
                content: {
                    title: movie.title,
                    subtitle: movie.overview,
                    images: [
                        { url: `${ specificMovieURL }${ movie.poster_path }?w=200&h=300` }
                    ],
                    buttons: [
                        {
                            type: 'openUrl',
                            title: 'View Details',
                            value: `${ movieURL }${ movie.id }`
                        }
                    ]
                }
            };
        });

        const carouselMessage = {
            type: 'message',
            attachmentLayout: 'carousel',
            attachments: carouselAttachments
        };

        await context.sendActivity(carouselMessage);
    }

    async searchMovies(context, movieTitle) {
        const response = await axios.get(`${ url }search/movie`, {
            params: {
                api_key: `${ MovieAPIKey }`,
                query: movieTitle
            }
        });

        const movies = response.data.results.slice(0, 10);

        const carouselAttachments = movies.map(movie => {
            return {
                contentType: 'application/vnd.microsoft.card.hero',
                content: {
                    title: movie.title,
                    subtitle: movie.overview,
                    images: [
                        { url: `${ specificMovieURL }${ movie.poster_path }?w=200&h=300` }
                    ],
                    buttons: [
                        {
                            type: 'openUrl',
                            title: 'View Details',
                            value: `${ movieURL }${ movie.id }`
                        }
                    ]
                }
            };
        });

        const carouselMessage = {
            type: 'message',
            attachmentLayout: 'carousel',
            attachments: carouselAttachments
        };

        await context.sendActivity(carouselMessage);
    }
}

module.exports.MyBot = MyBot;
