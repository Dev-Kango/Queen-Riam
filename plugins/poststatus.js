// Migrated from commands/poststatus.js

const { postStatus } = require('../lib/status');
const { getLang } = require('../lib/lang');

async function postStatusCommand(sock, chatId, message) {
    const body = message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || '';

    // Normalize (same as main.js): remove spaces between dot and command word,
    // then find where the command name ends and take everything after it as text.
    const normalized = body.replace(/\.\s+/g, '.').trim();
    const spaceIdx = normalized.indexOf(' ');
    const rawText = spaceIdx !== -1 ? normalized.slice(spaceIdx + 1).trim() : '';

    // Must have either text or a quoted media message
    const hasQuoted = !!message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!rawText && !hasQuoted) {
        return await sock.sendMessage(chatId, {
            text: getLang(sock).poststatus_usage
        });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '📡', key: message.key } });

        const result = await postStatus(sock, chatId, message, rawText);

        await sock.sendMessage(chatId, {
            text: result
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[poststatus] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `${getLang(sock).poststatus_failed}: ${err.message}`
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['poststatus', 'pstatus', 'setstatus'],
  description: 'Post media as WhatsApp status',
  category: 'owner',
}, async (sock, chatId, message) => {
  await postStatusCommand(sock, chatId, message);
});