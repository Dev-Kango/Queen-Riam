// Migrated from commands/gpt.js

const axios = require("axios");
const { getLang } = require('../lib/lang');

async function gptCommand(sock, chatId, message, query) {
    try {
        // React with 🤖 while processing
        await sock.sendMessage(chatId, {
            react: { text: "🤖", key: message.key }
        });

        const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(query)}&model=gpt-4.5`;

        const response = await axios.get(apiUrl);

        if (response.data && response.data.success && response.data.message?.content) {
            const answer = response.data.message.content;
            await sock.sendMessage(chatId, { text: answer });
        } else {
            throw new Error("Invalid GPT response");
        }
    } catch (error) {
        console.error("GPT API Error:", error.message);
        await sock.sendMessage(chatId, { text: getLang(sock).gpt_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['gpt'],
  description: 'Chat with ChatGPT',
  category: 'ai',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!query) { await sock.sendMessage(chatId, { text: '❌ Usage: ' + ctx.effectivePrefix + 'gpt <question>' }); return; }
  await gptCommand(sock, chatId, message, query);
});