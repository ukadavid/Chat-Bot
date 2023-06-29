const { ActivityHandler, ActionTypes, MessageFactory, MemoryStorage, CardFactory, ConversationState } = require('botbuilder');
const validateEmailAddresses = require('./validateEmails');

class MyBot extends ActivityHandler {
    constructor() {
        super();

        const conversationState = new ConversationState(new MemoryStorage());
        this.conversationState = conversationState.createProperty('conversationState');

        this.onMembersAdded(async (context, next) => {
            for (const member of context.activity.membersAdded) {
                if (member.id === context.activity.recipient.id) {
                    // Prompt the user to input their name
                    await context.sendActivity('Please enter your name:');
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
                const selectedOption = parseInt(text, 10);
                if (!isNaN(selectedOption) && selectedOption >= 1 && selectedOption <= 6) {
                    // Option selected, display the selected option
                    await context.sendActivity(`You selected: Option ${ selectedOption }`);
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
        const cardActions = [
            { type: ActionTypes.ImBack, title: 'Option 1', value: '1' },
            { type: ActionTypes.ImBack, title: 'Option 2', value: '2' },
            { type: ActionTypes.ImBack, title: 'Option 3', value: '3' },
            { type: ActionTypes.ImBack, title: 'Option 4', value: '4' },
            { type: ActionTypes.ImBack, title: 'Option 5', value: '5' },
            { type: ActionTypes.ImBack, title: 'Option 6', value: '6' }
        ];

        const card = CardFactory.heroCard(
            'Main Menu',
            'Welcome to XYZ, what can I do for you today?',
            undefined,
            cardActions
        );

        const reply = MessageFactory.attachment(card);
        await context.sendActivity(reply);
    }
}

module.exports.MyBot = MyBot;
