const { Scraper } = require('./scraper');

exports.handler = async (event) => {
    try {
        return await Scraper(event.url);
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'An error occurred while trying to execute the scraper',
            }),
        };
    }
};
