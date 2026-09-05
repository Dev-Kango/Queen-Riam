// Migrated from commands/ngl.js

const axios = require("axios");
const { getLang } = require('../lib/lang');

// Set your NGL username here:
const NGL_USERNAME = "officialkango";

async function nglCommand(sock, chatId, message, userMessage, settings) {
    const text = userMessage.split(" ").slice(1).join(" "); // message after `.ngl`

    if (!text) {
        await sock.sendMessage(chatId, {
            text: `${getLang(sock).ngl_no_message}\n\nUsage: ${settings.prefix}ngl I think the bot needs more memes.`
        });
        return;
    }

    try {
        // Send anonymous message to your NGL inbox
        const res = await axios.post("https://ngl.link/api/submit", {
            username: NGL_USERNAME,
            question: text,
            deviceId: (Math.random() + 1).toString(36).substring(7)
        });

        if (res.status === 200) {
            await sock.sendMessage(chatId, {
                text: `${getLang(sock).ngl_sent} "${text}"`
            });
        } else {
            await sock.sendMessage(chatId, {
                text: getLang(sock).ngl_failed
            });
        }

    } catch (err) {
        console.error("nglCommand error:", err);
        await sock.sendMessage(chatId, {
            text: getLang(sock).ngl_error
        });
    }
}

const settings = require('../settings');



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ngl'],
  description: 'Send anonymous NGL message',
  category: 'tools',
}, async (sock, chatId, message, args, query, ctx) => {
  await nglCommand(sock, chatId, message, ctx.userMessage, settings);
});