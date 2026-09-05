// Migrated from commands/tts.js

const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const { getLang } = require('../lib/lang');

async function ttsCommand(sock, chatId, text, message, language = 'en') {
    if (!text) {
        await sock.sendMessage(chatId, { text: getLang(sock).tts_no_text });
        return;
    }

    // React 🔄 while processing
    await sock.sendMessage(chatId, { react: { text: "🔄", key: message.key } });

    const fileName = `tts-${Date.now()}.mp3`;
    const filePath = path.join(__dirname, '..', 'media', fileName);

    const gtts = new gTTS(text, language);
    gtts.save(filePath, async function (err) {
        if (err) {
            console.error("TTS Error:", err);
            await sock.sendMessage(chatId, { text: getLang(sock).tts_error_gen });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        try {
            // ✅ Read the file after saving
            const audioBuffer = fs.readFileSync(filePath);

            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: 'riam.mp3',
                ptt: false
            });

            // React ✅ on success
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        } catch (e) {
            console.error("Send Error:", e);
            await sock.sendMessage(chatId, { text: getLang(sock).tts_failed_send });
        } finally {
            // 🧹 Clean up temp file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['tts'],
  description: 'Text to speech',
  category: 'tools',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!query) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'tts <text>' }); return; }
  await ttsCommand(sock, chatId, query, message);
});