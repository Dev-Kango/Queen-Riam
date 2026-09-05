const { bot } = require('../lib/pluginLoader');

bot({
  command: ['tagadmin', 'tagadmins'],
  description: 'Mention all group administrators',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) {
    await sock.sendMessage(chatId, { text: '❌ This command can only be used in a group.' });
    return;
  }

  try {
    const metadata = await sock.groupMetadata(chatId);
    const admins = (metadata.participants || []).filter(
      participant => participant.admin === 'admin' || participant.admin === 'superadmin'
    );

    if (!admins.length) {
      await sock.sendMessage(chatId, { text: '❌ No group administrators were found.' });
      return;
    }

    const customText = (query || args.join(' ')).trim();
    const body = customText || 'Attention group administrators';
    const mentions = admins.map(participant => participant.id);
    const adminList = mentions.map(jid => '@' + jid.split('@')[0]).join(' ');

    await sock.sendMessage(chatId, {
      text: body + '\n\n' + adminList,
      mentions,
    });
  } catch (error) {
    console.error('Error in tagadmins command:', error);
    await sock.sendMessage(chatId, { text: '❌ Could not retrieve the group administrators.' });
  }
});
