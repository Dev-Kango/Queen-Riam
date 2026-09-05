// Migrated from commands/deepseek.js

const axios = require("axios");
const { getLang } = require('../lib/lang');

async function deepseekCommand(sock, chatId, message, query) {
    try {
        // React with 🤖 while processing
        await sock.sendMessage(chatId, {
            react: { text: "🤖", key: message.key }
        });

        const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(query)}&model=deepseek`;

        const response = await axios.get(apiUrl);

        if (response.data && response.data.success && response.data.message?.content) {
            const answer = response.data.message.content;
            await sock.sendMessage(chatId, { text: answer });
        } else {
            throw new Error("Invalid Deepseek response");
        }
    } catch (error) {
        console.error("Deepseek API Error:", error.message);
        await sock.sendMessage(chatId, { text: getLang(sock).deepseek_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['deepseek'],
  description: 'Chat with DeepSeek AI',
  category: 'ai',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!query) { await sock.sendMessage(chatId, { text: '❌ Usage: ' + ctx.effectivePrefix + 'deepseek <question>' }); return; }
  await deepseekCommand(sock, chatId, message, query);
});