// Migrated from commands/close.js

const isAdmin = require('../lib/isAdmin');

const { getLang } = require('../lib/lang');
async function closeGroupCommand(sock, chatId, senderId, message) {
    console.log(`Attempting to close the group: ${chatId}`);

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin });
    }

    if (!isSenderAdmin) {
        return sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin });
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement'); // Close group
        await sock.sendMessage(chatId, { text: getLang(sock).close_success });
    } catch (error) {
        console.error('Error closing group:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).close_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['close'],
  description: 'Close the group (admins only)',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  await closeGroupCommand(sock, chatId, ctx.senderId, message);
});