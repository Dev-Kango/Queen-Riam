// Migrated from commands/wallpaper.js

const axios = require('axios');
const cheerio = require('cheerio');
const { getLang } = require('../lib/lang');

const BASE = 'https://4kwallpapers.com';
const HEADERS = {
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'referer': 'https://4kwallpapers.com/'
};

async function fetchHtml(url) {
    const res = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    return res.data;
}

async function searchWallpapers(query) {
    const html = await fetchHtml(`${BASE}/search/?q=${encodeURIComponent(query)}`);
    const $ = cheerio.load(html);
    const results = [];

    $('a[href*=".html"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || results.length >= 10) return;
        if (!href.includes(BASE) && !href.startsWith('/')) return;
        const fullHref = href.startsWith('http') ? href : BASE + href;
        // only wallpaper detail pages (not search/category pages)
        if (!/\/[a-z0-9-]+-(\d+)\.html$/.test(fullHref)) return;
        if (!results.includes(fullHref)) results.push(fullHref);
    });

    return results.slice(0, 10);
}

async function getWallpaperImage(detailUrl) {
    const html = await fetchHtml(detailUrl);
    const $ = cheerio.load(html);

    // Preferred resolutions in order (portrait-friendly for mobile)
    const mobileRes = ['1080x2400', '1080x2340', '1080x2160', '1080x1920', '720x1280'];
    const desktopRes = ['3840x2160', '2560x1440', '1920x1080', '1366x768'];
    const preferred = [...mobileRes, ...desktopRes];

    const allLinks = [];
    $('a[href*="/images/wallpapers/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) allLinks.push(href.startsWith('http') ? href : BASE + href);
    });

    if (!allLinks.length) return null;

    // try preferred resolution first
    for (const res of preferred) {
        const match = allLinks.find(l => l.includes(res));
        if (match) return match;
    }

    // fallback to first available
    return allLinks[0];
}

async function wallpaperCommand(sock, chatId, message) {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const query = text.split(' ').slice(1).join(' ').trim();

    if (!query) {
        return await sock.sendMessage(chatId, {
            text: getLang(sock).wallpaper_no_query
        });
    }

    await sock.sendMessage(chatId, {
        text: getLang(sock).wallpaper_searching.replace('{query}', query)
    });

    let detailPages;
    try {
        detailPages = await searchWallpapers(query);
    } catch (err) {
        return await sock.sendMessage(chatId, {
            text: getLang(sock).wallpaper_error
        });
    }

    if (!detailPages.length) {
        return await sock.sendMessage(chatId, {
            text: getLang(sock).wallpaper_not_found.replace('{query}', query)
        });
    }

    await sock.sendMessage(chatId, {
        text: getLang(sock).wallpaper_found.replace('{count}', detailPages.length)
    });

    // Fetch all detail pages concurrently
    const imageUrls = await Promise.all(
        detailPages.map(url => getWallpaperImage(url).catch(() => null))
    );

    const valid = imageUrls.filter(Boolean);

    if (!valid.length) {
        return await sock.sendMessage(chatId, {
            text: getLang(sock).wallpaper_no_images
        });
    }

    let sent = 0;
    for (const imgUrl of valid) {
        try {
            const ext = imgUrl.endsWith('.png') ? 'png' : 'jpeg';
            const res = imgUrl.match(/(\d{3,4}x\d{3,4})/)?.[1] || '';
            await sock.sendMessage(chatId, {
                image: { url: imgUrl },
                mimetype: `image/${ext}`,
                caption: `🖼️ *${query} Wallpaper*${res ? ` | ${res}` : ''}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ǫᴜᴇᴇɴ ʀɪᴀᴍ`
            });
            sent++;
        } catch (err) {
            console.warn('[wallpaper] Failed to send image:', imgUrl, err.message);
        }
    }

    if (sent === 0) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).wallpaper_send_failed
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['wallpaper', 'wall'],
  description: 'Get a random wallpaper',
  category: 'download',
}, async (sock, chatId, message) => {
  await wallpaperCommand(sock, chatId, message);
});