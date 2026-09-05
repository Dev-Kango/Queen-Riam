// Migrated from commands/owner.js
const settings = require('../settings');
const { bot } = require('../lib/pluginLoader');

bot({
  command: ['owner'],
  description: 'Get owner information',
  category: 'general',
}, async (sock, chatId) => {
  await sock.sendMessage(chatId, {
    text: '*Queen Riam Owner*\n\nName: ' + settings.botOwner + '\nNumber: +' + settings.ownerNumber,
  });
});
