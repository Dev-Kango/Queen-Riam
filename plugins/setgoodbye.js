// Migrated from commands/setgoodbye.js
const { hasOwnerPrivileges } = require('./sudo');

const { setCustomGoodbye, clearCustomGoodbye, getCustomGoodbye } = require('../lib/welcome');

const { getLang } = require('../lib/lang');
const HELP = `⚙️ *Set a custom goodbye message for this group.*

*Placeholders you can use:*
• \`{user}\` → tagged member
• \`{group}\` → group name
• \`{count}\` → remaining member count
• \`{time}\` → leave time
• \`{date}\` → leave date

*Usage:*
• \`.setgoodbye Goodbye {user}! We'll miss you 😢\`
• \`.setgoodbye reset\` → go back to default message`;

async function setGoodbyeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: getLang(sock).setgoodbye_groups_only });
    }

    const body = message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || '';

    const normalized = body.replace(/\.\s+/g, '.').trim();
    const spaceIdx = normalized.indexOf(' ');
    const arg = spaceIdx !== -1 ? normalized.slice(spaceIdx + 1).trim() : '';

    if (!arg) {
        const current = getCustomGoodbye(chatId);
        const status = current
            ? `*Current custom message:*\n${current}`
            : `_No custom message set — using default._`;
        return sock.sendMessage(chatId, { text: `${status}\n\n${HELP}` });
    }

    if (arg.toLowerCase() === 'reset') {
        clearCustomGoodbye(chatId);
        return sock.sendMessage(chatId, { text: getLang(sock).setgoodbye_reset });
    }

    setCustomGoodbye(chatId, arg);
    await sock.sendMessage(chatId, {
        text: `✅ *Custom goodbye message saved!*\n\n${arg}\n\n_Placeholders will be filled when a member leaves._`
    });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['setgoodbye'],
  description: 'Set custom goodbye message',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: '❌ Groups only.' }); return; }
  const isAdmin = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  if (!st.isSenderAdmin && !hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Admins only.' }); return; }
  await setGoodbyeCommand(sock, chatId, message);
});