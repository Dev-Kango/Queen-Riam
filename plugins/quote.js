// Migrated from commands/quote.js

const fetch = require('node-fetch');
const { sendButtonMessage } = require('../lib/buttonHelper');
const { getLang } = require('../lib/lang');
async function quoteCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://quotes-api.officialhectormanuel.workers.dev/?type=random`);
        if (!res.ok) throw await res.text();

        const json    = await res.json();
        let quoteText = json?.quote?.text || "Couldn't fetch a quote right now.";
        const author  = json?.quote?.author || "Unknown";
        quoteText     = quoteText.replace(/\(variation \d+\)/gi, "").trim();
        const text    = `${getLang(sock).quote_title}"${quoteText}"\n\n✍️ — *${author}*`;

        await sendButtonMessage(sock, chatId, {
            text,
            footer: 'Queen Riam 👑',
            buttons: [
                { id: '.quote', text: getLang(sock).quote_btn_another },
                { id: '.joke',  text: '😂 Get a Joke'   },
                { id: '.fact',  text: getLang(sock).joke_btn_fact },
            ],
        }, message);

    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).quote_error
        });
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['quote'],
  description: 'Get a random quote',
  category: 'fun',
}, async (sock, chatId, message) => {
  await quoteCommand(sock, chatId, message);
});