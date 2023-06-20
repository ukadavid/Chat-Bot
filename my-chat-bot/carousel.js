const { ActivityHandler, CardFactory } = require('botbuilder');

class CarouselBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {
            if (context.activity.text === 'show carousel') {
                await this.displayCarousel(context);
            } else {
                await context.sendActivity(`You said: ${ context.activity.text }`);
            }

            await next();
        });
    }

    async displayCarousel(context) {
        const carouselItems = [
            {
                title: 'Item 1',
                text: 'Description for Item 1',
                image: 'https://via.placeholder.com/300',
                buttons: [
                    { type: 'openUrl', title: 'More Info', value: 'https://example.com/item1' },
                    { type: 'imBack', title: 'Select', value: 'select item 1' }
                ]
            },
            {
                title: 'Item 2',
                text: 'Description for Item 2',
                image: 'https://via.placeholder.com/300',
                buttons: [
                    { type: 'openUrl', title: 'More Info', value: 'https://example.com/item2' },
                    { type: 'imBack', title: 'Select', value: 'select item 2' }
                ]
            }
            // Add more carousel items as needed
        ];

        const carouselCards = carouselItems.map((item) =>
            CardFactory.heroCard(
                item.title,
                item.text,
                [{ type: 'openUrl', title: 'More Info', value: item.image }],
                {
                    subtitle: item.text,
                    buttons: item.buttons
                }
            )
        );

        const carouselAttachment = CardFactory.carousel(carouselCards);

        await context.sendActivity({ attachments: [carouselAttachment] });
    }
}

module.exports.CarouselBot = CarouselBot;
