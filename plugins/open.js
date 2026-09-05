// Migrated from commands/open.js

const isAdmin = require('../lib/isAdmin');

const { getLang } = require('../lib/lang');
async function openGroupCommand(sock, chatId, senderId, message) {
    console.log(`Attempting to open the group: ${chatId}`);

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin });
    }

    if (!isSenderAdmin) {
        return sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin });
    }

    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement'); // Open group
        await sock.sendMessage(chatId, { text: getLang(sock).open_success });
    } catch (error) {
        console.error('Error opening group:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).open_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['open'],
  description: 'Open the group',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  await openGroupCommand(sock, chatId, ctx.senderId, message);
});