// catbox.js — Upload media to catbox.moe

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');
const axios = require('axios');
const { fromBuffer } = require('file-type');
const { getLang } = require('../lib/lang');
const { isButtonModeOn } = require('../lib/buttonHelper');
const { uploadToCatbox } = require('../lib/uploadImage');

let sendButtons;
try { sendButtons = require('kango-wa').sendButtons; } catch (_) { sendButtons = null; }

async function catboxCommand(sock, chatId, message) {
    const lang = getLang(sock);
    let targetMessage = message;
    const quoted = message.message?.extendedTextMessage?.contextInfo;

    if (quoted?.quotedMessage) {
        targetMessage = {
            key: { remoteJid: chatId, id: quoted.stanzaId, participant: quoted.participant },
            message: quoted.quotedMessage,
        };
    }

    const msg = targetMessage.message;
    const mediaMessage =
        msg?.imageMessage || msg?.videoMessage || msg?.audioMessage ||
        msg?.documentMessage || msg?.stickerMessage;

    if (!mediaMessage) {
        return await sock.sendMessage(chatId, { text: lang.catbox_no_media }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        await sock.sendMessage(chatId, { text: lang.catbox_uploading }, { quoted: message });

        const buffer = await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage,
        });
        if (!buffer) throw new Error('Failed to download media');

        const fileType = await fromBuffer(buffer);
        const ext      = fileType?.ext  || 'bin';
        const mime     = fileType?.mime || 'application/octet-stream';
        const sizeInMB = (buffer.length / (1024 * 1024)).toFixed(2);

        const link = await uploadToCatbox(buffer, ext, mime);

        const senderJid  = message.key.participant || message.key.remoteJid;
        const senderName = message.pushName || senderJid.split('@')[0];

        const reply =
            '╬══ 🗂️ *CATBOX UPLOADER* ╗\n' +
            '│ → 👤 *USER:* ' + senderName + '\n' +
            '│ → 📁 *TYPE:* ' + ext.toUpperCase() + '\n' +
            '│ → 🔩 *SIZE:* ' + sizeInMB + ' MB\n' +
            '│ → 🔗 *LINK:* ' + link + '\n' +
            '│ → ♾️ *EXPIRY:* No Expiry\n' +
            '└══════════════════\n\n' +
            '> *POWERED BY QUEEN RIAM*';

        if (isButtonModeOn() && sendButtons) {
            try {
                await sendButtons(sock, chatId, {
                    text: reply,
                    footer: '© Queen Riam',
                    buttons: [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copy URL',
                                copy_code: link,
                            }),
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🌐 Open Link',
                                url: link,
                                merchant_url: link,
                            }),
                        },
                    ],
                });
            } catch (_) {
                await sock.sendMessage(chatId, { text: reply });
            }
        } else {
            await sock.sendMessage(chatId, { text: reply });
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[catbox] upload error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: lang.catbox_error }, { quoted: message });
    }
}

const { bot } = require('../lib/pluginLoader');

bot({
    command: ['catbox', 'cb'],
    description: 'Upload media to catbox.moe (permanent hosting)',
    category: 'tools',
}, async (sock, chatId, message) => {
    await catboxCommand(sock, chatId, message);
});
