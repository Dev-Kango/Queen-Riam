// Migrated from commands/tgsearch.js

const axios = require('axios');
const cheerio = require('cheerio');
const { getLang } = require('../lib/lang');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36';
const BASE = 'https://en.tgramsearch.com';

async function resolveJoinLink(joinPath) {
    try {
        const { data } = await axios.get(`${BASE}${joinPath}`, {
            headers: { 'User-Agent': UA },
            timeout: 10000,
        });
        const $ = cheerio.load(data);
        let resolved = null;
        $('a[href^="tg://resolve"]').each((_, el) => {
            const href = $(el).attr('href');
            const match = href.match(/tg:\/\/resolve\?domain=(.+)/);
            if (match) { resolved = `https://t.me/${match[1]}`; return false; }
        });
        return resolved;
    } catch { return null; }
}

async function searchTelegram(query) {
    const { data } = await axios.get(`${BASE}/search?query=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': UA },
        timeout: 15000,
    });
    const $ = cheerio.load(data);
    const results = [];

    for (const el of $('.tg-channel').toArray()) {
        if (results.length >= 10) break;
        const name = $(el).find('.tg-channel__link a').text().trim();
        let link = $(el).find('.tg-channel__link a').attr('href');
        const image = $(el).find('.tg-channel__avatar img').attr('src');
        const members = $(el).find('.tg-stat__user-count').text().trim();
        const description = $(el).find('.tg-channel__description').text().trim();
        const categories = [];
        $(el).find('.tg-channel__categories a').each((_, a) => categories.push($(a).text().trim()));

        if (link?.startsWith('/join/')) {
            const real = await resolveJoinLink(link);
            link = real || `${BASE}${link}`;
        } else if (link?.startsWith('tg://resolve?domain=')) {
            const username = link.split('tg://resolve?domain=')[1];
            link = `https://t.me/${username}`;
        }

        results.push({ name, link, image, members, description, category: categories.join(', ') });
    }
    return results;
}

async function tgsearchCommand(sock, chatId, message, query) {
    if (!query) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).tgsearch_no_query,
        });
        return;
    }

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
    await sock.sendPresenceUpdate('composing', chatId);

    try {
        const results = await searchTelegram(query);

        if (results.length === 0) {
            await sock.sendMessage(chatId, {
                text: getLang(sock).tgsearch_not_found.replace('{query}', query),
            });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        let text = getLang(sock).tgsearch_header.replace('{query}', query) + '\n';
        results.forEach((r, i) => {
            text += `\n*${i + 1}. ${r.name}*`;
            text += `\n👥 Members: ${r.members || 'N/A'}`;
            if (r.category) text += `\n🏷️ Category: ${r.category}`;
            if (r.description) text += `\n📝 ${r.description.substring(0, 150)}`;
            text += `\n🔗 ${r.link}`;
            text += '\n';
        });

        text += `\n_Powered by Queen Riam_`;

        await sock.sendMessage(chatId, { text });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
        console.error('[TGSEARCH] Error:', err.message);
        await sock.sendMessage(chatId, {
            text: getLang(sock).tgsearch_error,
        });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    } finally {
        await sock.sendPresenceUpdate('paused', chatId);
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['tgsearch'],
  description: 'Search Telegram stickers',
  category: 'tools',
}, async (sock, chatId, message, args, query) => {
  await tgsearchCommand(sock, chatId, message, query);
});