const { ActivityHandler, CardFactory, MemoryStorage, ConversationState } = require('botbuilder');
const validateEmailAddresses = require('./validateEmails');

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
                    await this.displayMainMenu(context);
                } else {
                    // Failed authentication
                    await context.sendActivity('Invalid authentication code. Please try again:');
                }
            } else {
                // Authenticated, handle main menu options
                const selectedOption = context.activity.value?.title?.toLowerCase(); // Retrieve the title of the selected option

                if (selectedOption) {
                    switch (selectedOption) {
                    case 'option 1':
                        await context.sendActivity('You selected: Option 1');
                        break;
                    case 'option 2':
                        await context.sendActivity('You selected: Option 2');
                        break;
                    case 'option 3':
                        await context.sendActivity('You selected: Option 3');
                        break;
                    case 'option 4':
                        await context.sendActivity('You selected: Option 4');
                        break;
                    case 'option 5':
                        await context.sendActivity('You selected: Option 5');
                        break;
                    case 'option 6':
                        await context.sendActivity('You selected: Option 6');
                        break;
                    default:
                        await context.sendActivity(`Invalid option: ${ selectedOption }`);
                        break;
                    }
                } else {
                    await context.sendActivity('Invalid option. Please select a valid option:');
                }
            }
            await this.conversationState.set(context, conversationData); // Save conversation state
            await conversationState.saveChanges(context); // Persist changes

            await next();
        });
    }

    async displayMainMenu(context) {
        // Create an Adaptive Card instance
        const adaptiveCard = CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'Image',
                    url: 'http://adaptivecards.io/content/adaptive-card-50.png'
                },
                {
                    type: 'TextBlock',
                    text: '**Main menu**'
                }
            ],
            actions: [
                { type: 'Action.Submit', title: 'Option 1' },
                { type: 'Action.Submit', title: 'Option 2' },
                { type: 'Action.Submit', title: 'Option 3' },
                { type: 'Action.Submit', title: 'Option 4' },
                { type: 'Action.Submit', title: 'Option 5' },
                { type: 'Action.Submit', title: 'Option 6' }
            ]
        });

        // Render the adaptive card and send it as a reply
        const cardMessage = { type: 'message', attachments: [adaptiveCard] };
        await context.sendActivity(cardMessage);
    }
}

module.exports.MyBot = MyBot;
