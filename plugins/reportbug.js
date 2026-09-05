// Migrated from commands/reportbug.js

const { getLang } = require('../lib/lang');
async function reportBugCommand(sock, chatId, message, userMessage, settings) {
    const sender = message.key.participant || message.key.remoteJid;
    const text = userMessage.split(" ").slice(1).join(" "); // everything after .reportbug

    if (!text) {
        await sock.sendMessage(chatId, { text: getLang(sock).reportbug_usage.replace('{prefix}', settings.prefix) });
        return;
    }

    // format bug report
    const bugReportMsg = `
*🐞 BUG REPORT*

👤 *User*: @${sender.split("@")[0]}
💬 *Issue*: ${text}
⚙️ *Version*: ${settings.version || "1.0.0"}
    `;

    const confirmationMsg = getLang(sock).reportbug_confirm
        .replace('{name}', message.pushName || 'there') + '\n\n*Details sent:*\n' + bugReportMsg;

    try {
        const ownerJid = "233509977126@s.whatsapp.net";
        await sock.sendMessage(ownerJid, { text: bugReportMsg, mentions: [sender] });
        await sock.sendMessage(chatId, { text: confirmationMsg, mentions: [sender] });

    } catch (err) {
        console.error("reportBugCommand error:", err);
        await sock.sendMessage(chatId, { text: getLang(sock).reportbug_failed });
    }
}

const settings = require('../settings');



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['reportbug'],
  description: 'Report a bug',
  category: 'general',
}, async (sock, chatId, message, args, query, ctx) => {
  await reportBugCommand(sock, chatId, message, ctx.userMessage, settings);
});