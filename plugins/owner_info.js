const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ownerinfo'],
  description: 'Get owner information',
  category: 'general',
}, async (sock, chatId, message) => {
  try {
    await sock.sendMessage(chatId, { react: { text: '👑', key: message.key } });
    const ownerName = 'Hector Manuel';
    const ownerNumber = '233509977126';
    const botProject = 'KANGO-XMD';
    const userJid = message.key.participant || message.key.remoteJid;
    await sock.sendMessage(chatId, {
      text: 'Hello @' + userJid.split('@')[0] + ',\n\nI am *' + botProject + '*, owned by *' + ownerName + '*.\n\nOwner number: +' + ownerNumber,
      mentions: [userJid]
    });
    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
  } catch (err) {
    console.error('Error in owner command:', err);
  }
});
