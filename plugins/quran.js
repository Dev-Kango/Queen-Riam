// Migrated from commands/quran.js

const axios = require('axios');
const { getLang } = require('../lib/lang');
async function quranCommand(sock, chatId, message, query) {
    try {
        if (!query) {
            await sock.sendMessage(chatId, { text: getLang(sock).quran_usage });
            return;
        }

        const parts = query.includes(':') ? query.split(':') : query.trim().split(/\s+/);
        const surah = parseInt(parts[0]);
        const ayah = parseInt(parts[1]);

        if (!surah || !ayah || isNaN(surah) || isNaN(ayah)) {
            await sock.sendMessage(chatId, { text: getLang(sock).quran_invalid });
            return;
        }

        const url = `https://quran-api.officialhectormanuel.workers.dev/?s=${surah}&a=${ayah}`;
        const res = await axios.get(url);

        if (!res.data.status) {
            await sock.sendMessage(chatId, { text: getLang(sock).quran_not_found });
            return;
        }

        const { arabic, english, audio } = res.data;

        const reply =
            `🕌 *Surah ${surah}, Ayah ${ayah}*\n\n` +
            `*Arabic:*\n${arabic}\n\n` +
            `*English:*\n${english}`;

        await sock.sendMessage(chatId, { text: reply });

        await sock.sendMessage(chatId, {
            audio: { url: audio },
            mimetype: "audio/mp4",
            ptt: true
        });

    } catch (err) {
        await sock.sendMessage(chatId, { text: getLang(sock).quran_error });
        console.error("Quran command error:", err.message);
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['quran'],
  description: 'Get a Quran verse',
  category: 'religion',
}, async (sock, chatId, message, args, query) => {
  await quranCommand(sock, chatId, message, query);
});