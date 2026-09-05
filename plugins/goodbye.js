// Migrated from commands/goodbye.js
const { hasOwnerPrivileges } = require('./sudo');

const { handleGoodbye } = require('../lib/welcome');
const { getLang } = require('../lib/lang');

async function goodbyeCommand(sock, chatId, message, match) {
    // Check if it's a group
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: getLang(sock).group_only });
        return;
    }

    // Extract match from message
    const text = message.message?.conversation || 
                message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');

    await handleGoodbye(sock, chatId, message, matchText);
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['goodbye'],
  description: 'Toggle goodbye messages',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'Groups only.' }); return; }
  const isAdmin = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  if (!st.isSenderAdmin && !hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: 'Admins only.' }); return; }
  await goodbyeCommand(sock, chatId, message);
});