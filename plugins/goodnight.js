// Migrated from commands/goodnight.js

const fetch = require("node-fetch");
const { getLang } = require('../lib/lang');

async function goodnightCommand(sock, chatId, message) {
    try {
        const res = await fetch("https://goodnight-api.officialhectormanuel.workers.dev/");
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const goodnightMessage = json.message || "Good night 🌙💤";

        // Send the goodnight message
        await sock.sendMessage(chatId, { text: goodnightMessage });
    } catch (error) {
        console.error("Error in goodnight command:", error);
        await sock.sendMessage(
            chatId,
            { text: getLang(sock).goodnight_error }
        );
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['goodnight'],
  description: 'Send a goodnight message',
  category: 'fun',
}, async (sock, chatId, message) => {
  await goodnightCommand(sock, chatId, message);
});