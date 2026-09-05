// Migrated from commands/unmute.js

const { getLang } = require('../lib/lang');
async function unmuteCommand(sock, chatId) {
    await sock.groupSettingUpdate(chatId, 'not_announcement'); // Unmute the group
    await sock.sendMessage(chatId, { text: getLang(sock).mute_unmuted });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['unmute'],
  description: 'Unmute a member',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  await unmuteCommand(sock, chatId, ctx.senderId);
});