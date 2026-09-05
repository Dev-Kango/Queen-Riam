// Migrated from commands/clear.js

const { getLang } = require('../lib/lang');
async function clearCommand(sock, chatId) {
    try {
        const message = await sock.sendMessage(chatId, { text: getLang(sock).clear_clearing });
        const messageKey = message.key; // Get the key of the message the bot just sent
        
        // Now delete the bot's message
        await sock.sendMessage(chatId, { delete: messageKey });
        
    } catch (error) {
        console.error('Error clearing messages:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).clear_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['clear', 'clr'],
  description: 'Clear group chat',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (ctx.isGroup) await clearCommand(sock, chatId);
});