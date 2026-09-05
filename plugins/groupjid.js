const { bot } = require('../lib/pluginLoader');


bot({
  command: ['groupjid', 'jid'],
  description: 'Get current group JID',
  category: 'general',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) {
    await sock.sendMessage(chatId, { text: '❌ This command can only be used in a group.' });
  } else {
    await sock.sendMessage(chatId, { text: '✅ Group JID: ' + chatId });
  }
});
