const { bot } = require('../lib/pluginLoader');


bot({
  command: ['saveppgc'],
  description: 'Save group profile picture',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: '❌ Groups only.' }); return; }
  let groupName = chatId.split('@')[0];
  try { const m = await sock.groupMetadata(chatId); groupName = m.subject || groupName; } catch (_) {}
  try {
    const picUrl = await sock.profilePictureUrl(chatId, 'image');
    await sock.sendMessage(chatId, { image: { url: picUrl }, caption: '*Group Picture of* ' + groupName });
  } catch (_) {
    await sock.sendMessage(chatId, { text: '❌ Group has no picture.' });
  }
});
