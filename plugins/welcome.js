// Migrated from commands/welcome.js
const { hasOwnerPrivileges } = require('./sudo');

const { handleWelcome } = require("../lib/welcome");
const { getLang } = require('../lib/lang');

async function welcomeCommand(sock, chatId, message) {
    if (!chatId.endsWith("@g.us")) {
        await sock.sendMessage(chatId, { text: getLang(sock).group_only });
        return;
    }

    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || "";
    const matchText = text.split(" ").slice(1).join(" ");

    await handleWelcome(sock, chatId, message, matchText);
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['welcome'],
  description: 'Toggle welcome messages',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'Groups only.' }); return; }
  const isAdmin = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  if (!st.isSenderAdmin && !hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: 'Admins only.' }); return; }
  await welcomeCommand(sock, chatId, message);
});