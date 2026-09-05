const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

function getTargetJid(message, args, chatId) {
  const context = message.message?.extendedTextMessage?.contextInfo;
  const mentioned = context?.mentionedJid?.[0];
  const quoted = context?.participant;
  const raw = mentioned || quoted || args[0] || (
    chatId && chatId.endsWith('@s.whatsapp.net') ? chatId : null
  );
  if (!raw) return null;

  if (raw.includes('@')) {
    return raw;
  }

  const digits = raw.replace(/[^0-9]/g, '');
  return digits.length >= 7 ? digits + '@s.whatsapp.net' : null;
}

bot({
  command: ['block', 'unblock'],
  description: 'Block or unblock a WhatsApp contact',
  category: 'owner',
  menuCommands: ['block', 'unblock'],
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '❌ This command is only for the owner and sudo users!' });
    return;
  }

  const target = getTargetJid(message, args, chatId);
  if (!target) {
    await sock.sendMessage(chatId, {
      text: 'Usage: ' + ctx.effectivePrefix + ctx.c + ' <international_number>\nIn a private chat, you can use ' + ctx.effectivePrefix + ctx.c + ' without a number to target that contact.\nYou can also mention or reply to a contact.',
    });
    return;
  }

  const action = ctx.c === 'unblock' ? 'unblock' : 'block';
  try {
    await sock.updateBlockStatus(target, action);
    await sock.sendMessage(chatId, {
      text: '✅ Contact ' + (action === 'block' ? 'blocked' : 'unblocked') + ' successfully.',
    });
  } catch (error) {
    console.error('Error in ' + action + ' command:', error);
    await sock.sendMessage(chatId, {
      text: '❌ Could not ' + action + ' that contact. Check the number or try again.',
    });
  }
});
