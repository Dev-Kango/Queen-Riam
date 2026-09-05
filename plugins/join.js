const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

function extractInviteCode(input) {
  const value = String(input || '').trim();
  const match = value.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,30})/i);
  return (match ? match[1] : value.replace(/[^0-9A-Za-z]/g, '')) || null;
}

bot({
  command: ['join'],
  description: 'Join a WhatsApp group using an invite link',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '❌ This command is only for the owner and sudo users!' });
    return;
  }

  const code = extractInviteCode(query || args.join(' '));
  if (!code) {
    await sock.sendMessage(chatId, {
      text: 'Usage: ' + ctx.effectivePrefix + 'join https://chat.whatsapp.com/<invite_code>',
    });
    return;
  }

  try {
    const groupId = await sock.groupAcceptInvite(code);
    await sock.sendMessage(chatId, {
      text: '✅ Successfully joined the group.' + (groupId ? '\nGroup ID: ' + groupId : ''),
    });
  } catch (error) {
    console.error('Error in join command:', error);
    await sock.sendMessage(chatId, { text: '❌ Could not join that group. The link may be invalid or expired.' });
  }
});
