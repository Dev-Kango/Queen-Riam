// Migrated from commands/gif.js
const axios = require('axios');
const settings = require('../settings'); // Assuming the API key is stored here
const { getLang } = require('../lib/lang');

async function gifCommand(sock, chatId, query) {
    const apiKey = settings.giphyApiKey; // Replace with your Giphy API Key

    if (!query) {
        await sock.sendMessage(chatId, { text: getLang(sock).gif_no_query });
        return;
    }

    try {
        const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
            params: {
                api_key: apiKey,
                q: query,
                limit: 1,
                rating: 'g'
            }
        });

        const gifUrl = response.data.data[0]?.images?.downsized_medium?.url;

        if (gifUrl) {
            await sock.sendMessage(chatId, { video: { url: gifUrl }, caption: `Here is your GIF for "${query}"` });
        } else {
            await sock.sendMessage(chatId, { text: getLang(sock).gif_not_found });
        }
    } catch (error) {
        console.error('Error fetching GIF:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).gif_error });
    }
}

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['gif'],
  description: 'gif command',
  category: 'general',
}, async (sock, chatId, message, args, query, ctx) => {
  await gifCommand(sock, chatId, message, args, query, ctx);
});
