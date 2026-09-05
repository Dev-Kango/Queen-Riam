// Migrated from commands/gemini.js

const axios = require("axios");

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
        await sock.sendMessage(chatId, { text: "❌ Deepseek failed. Try again later." });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['gemini'],
  description: 'Chat with Google Gemini',
  category: 'ai',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!query) { await sock.sendMessage(chatId, { text: '❌ Usage: ' + ctx.effectivePrefix + 'gemini <question>' }); return; }
  await geminiCommand(sock, chatId, message, query);
});