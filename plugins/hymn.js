// Migrated from commands/hymn.js

const axios = require('axios');
const { getLang } = require('../lib/lang');

const BASE = 'https://catholichymn.officialhectormanuel.workers.dev';
async function hymnCommand(sock, chatId, message, args) {
    const lang = getLang(sock);
    try {
        const input = args.join(' ').trim();

        if (!input) {
            await sock.sendMessage(chatId, {
                text: lang.hymn_usage
            });
            return;
        }

        const isNumber = /^\d+$/.test(input);

        if (isNumber) {
            const num = parseInt(input);
            if (num < 1 || num > 508) {
                await sock.sendMessage(chatId, {
                    text: lang.hymn_range
                });
                return;
            }

            const res = await axios.get(`${BASE}/hymns/${num}`);
            const hymn = res.data?.data;

            if (!hymn) {
                await sock.sendMessage(chatId, { text: lang.hymn_not_found });
                return;
            }

            const reply =
                `✝️ *Hymn #${hymn.number}*\n` +
                `📖 *${hymn.title}*\n\n` +
                `${hymn.lyrics}`;

            await sock.sendMessage(chatId, { text: reply });

        } else {
            const res = await axios.get(`${BASE}/hymns/search?q=${encodeURIComponent(input)}`);
            const results = res.data?.data;

            if (!results || results.length === 0) {
                await sock.sendMessage(chatId, {
                    text: lang.hymn_no_results
                });
                return;
            }

            if (results.length === 1) {
                const detail = await axios.get(`${BASE}/hymns/${results[0].number}`);
                const hymn = detail.data?.data;
                const reply =
                    `✝️ *Hymn #${hymn.number}*\n` +
                    `📖 *${hymn.title}*\n\n` +
                    `${hymn.lyrics}`;
                await sock.sendMessage(chatId, { text: reply });
                return;
            }

            const list = results.slice(0, 15)
                .map(h => `• *#${h.number}* — ${h.title}`)
                .join('\n');

            const total = res.data?.total || results.length;
            const footer = total > 15 ? `\n\n_Showing 15 of ${total} results. Use .hymn <number> to get a specific hymn._` : '';

            await sock.sendMessage(chatId, {
                text: `✝️ *Hymn Search: "${input}"*\n\n${list}${footer}`
            });
        }

    } catch (err) {
        await sock.sendMessage(chatId, {
            text: lang.hymn_error
        });
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['hymn'],
  description: 'Get a hymn',
  category: 'religion',
}, async (sock, chatId, message, args) => {
  await hymnCommand(sock, chatId, message, args);
});