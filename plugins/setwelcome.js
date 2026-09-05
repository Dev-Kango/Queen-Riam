// Migrated from commands/setwelcome.js
const { hasOwnerPrivileges } = require('./sudo');

const { setCustomWelcome, clearCustomWelcome, getCustomWelcome } = require('../lib/welcome');

const { getLang } = require('../lib/lang');
const HELP = `⚙️ *Set a custom welcome message for this group.*

*Placeholders you can use:*
• \`{user}\` → tagged member
• \`{group}\` → group name
• \`{count}\` → total member count
• \`{time}\` → join time
• \`{date}\` → join date

*Usage:*
• \`.setwelcome Hello {user}! Welcome to {group} 🎉\`
• \`.setwelcome reset\` → go back to default message`;

async function setWelcomeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: getLang(sock).setwelcome_groups_only });
    }

    const body = message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || '';

    const normalized = body.replace(/\.\s+/g, '.').trim();
    const spaceIdx = normalized.indexOf(' ');
    const arg = spaceIdx !== -1 ? normalized.slice(spaceIdx + 1).trim() : '';

    if (!arg) {
        const current = getCustomWelcome(chatId);
        const status = current
            ? `*Current custom message:*\n${current}`
            : `_No custom message set — using default._`;
        return sock.sendMessage(chatId, { text: `${status}\n\n${HELP}` });
    }

    if (arg.toLowerCase() === 'reset') {
        clearCustomWelcome(chatId);
        return sock.sendMessage(chatId, { text: getLang(sock).setwelcome_reset });
    }

    setCustomWelcome(chatId, arg);
    await sock.sendMessage(chatId, {
        text: `✅ *Custom welcome message saved!*\n\n${arg}\n\n_Placeholders will be filled when a member joins._`
    });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['setwelcome'],
  description: 'Set custom welcome message',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: '❌ Groups only.' }); return; }
  const isAdmin = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  if (!st.isSenderAdmin && !hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Admins only.' }); return; }
  await setWelcomeCommand(sock, chatId, message);
});