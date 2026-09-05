const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

function getGroupId(chatId, args) {
  if (chatId.endsWith('@g.us')) return chatId;
  const candidate = String(args[0] || '').trim();
  return candidate.endsWith('@g.us') ? candidate : null;
}

bot({
  command: ['leave'],
  description: 'Leave the current or specified WhatsApp group',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '❌ This command is only for the owner and sudo users!' });
    return;
  }

  const groupId = getGroupId(chatId, args);
  if (!groupId) {
    await sock.sendMessage(chatId, {
      text: 'Use ' + ctx.effectivePrefix + 'leave inside a group, or provide a group ID ending in @g.us.',
    });
    return;
  }

  try {
    await sock.groupLeave(groupId);
    if (groupId !== chatId) {
      await sock.sendMessage(chatId, { text: '✅ Left the specified group successfully.' });
    }
  } catch (error) {
    console.error('Error in leave command:', error);
    await sock.sendMessage(chatId, { text: '❌ Could not leave that group.' });
  }
});
