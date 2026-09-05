// Migrated from commands/fact.js

const axios = require('axios');
const { sendButtonMessage } = require('../lib/buttonHelper');
const { getLang } = require('../lib/lang');
async function factCommand(sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const text     = `${getLang(sock).fact_title}${response.data.text}`;

        await sendButtonMessage(sock, chatId, {
            text,
            footer: 'Queen Riam 👑',
            buttons: [
                { id: '.fact',  text: getLang(sock).fact_btn_another },
                { id: '.quote', text: getLang(sock).joke_btn_quote }, { id: '.joke',  text: getLang(sock).quote_btn_joke },
            ],
        }, message);

    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).fact_error
        });
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['fact'],
  description: 'Get a random fact',
  category: 'fun',
}, async (sock, chatId, message) => {
  await factCommand(sock, chatId, message, message);
});