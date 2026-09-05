// Migrated from commands/pair.js
const { hasOwnerPrivileges } = require('./sudo');

const { getLang } = require('../lib/lang');
const { generatePairingCode } = require('../lib/sessionManager');
const { isButtonModeOn } = require('../lib/buttonHelper');

let sendButtons;
try {
    sendButtons = require('kango-wa').sendButtons;
} catch (_) {
    sendButtons = null;
}


async function pairCommand(sock, chatId, message, args) {
    const t = getLang(sock);

    if (!hasOwnerPrivileges((message.key.participantAlt || message.key.participant || message.key.remoteJidAlt || message.key.remoteJid), message, sock.user?.id, sock._sessionNumber)) {
        await sock.sendMessage(chatId, { text: t.pair_owner_only });
        return;
    }

    const raw = args[0]?.replace(/\D/g, '');

    if (!raw || raw.length < 7 || raw.length > 15) {
        await sock.sendMessage(chatId, { text: t.pair_usage });
        return;
    }

    await sock.sendMessage(chatId, {
        text: t.pair_generating.replace('{number}', raw)
    });

    try {
        const code = await generatePairingCode(raw);

        if (!code) {
            await sock.sendMessage(chatId, {
                text: `✅ *+${raw}* is already linked to the bot!`
            });
            return;
        }

        const response = t.pair_success
            .replace(/\{number\}/g, raw)
            .replace('{code}', code);

        if (isButtonModeOn() && sendButtons) {
            try {
                await sendButtons(sock, chatId, {
                    text: response,
                    footer: '© Queen Riam',
                    buttons: [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copy Code',
                                copy_code: code
                            })
                        }
                    ],
                });
            } catch (_) {
                await sock.sendMessage(chatId, { text: response });
            }
        } else {
            await sock.sendMessage(chatId, { text: response });
        }

    } catch (err) {
        if (err.message === 'ALREADY_ACTIVE') {
            await sock.sendMessage(chatId, {
                text: t.pair_already_active.replace('{number}', raw)
            });
        } else {
            console.error('Error in pair command:', err);
            await sock.sendMessage(chatId, { text: t.pair_failed });
        }
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['pair'],
  description: 'Pair a new session',
  category: 'owner',
}, async (sock, chatId, message, args) => {
  await pairCommand(sock, chatId, message, args);
});