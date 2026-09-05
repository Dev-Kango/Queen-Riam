const { getRedditMedia, isValidRedditUrl } = require('../lib/reddit');
const { bot } = require('../lib/pluginLoader');

function findRedditUrl(message) {
    const text = message?.message?.conversation
        || message?.message?.extendedTextMessage?.text
        || '';

    const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quoted?.conversation
        || quoted?.extendedTextMessage?.text
        || '';

    const combined = `${text}\n${quotedText}`;
    const match = combined.match(/https?:\/\/(?:www\.|old\.|new\.)?(?:reddit\.com|redd\.it)\/[^\s<>]+/i);
    return match ? match[0].replace(/[),.!?]+$/, '') : '';
}

async function redditCommand(sock, chatId, message) {
    const url = findRedditUrl(message);

    if (!url) {
        return sock.sendMessage(chatId, {
            text: '📥 Send a Reddit post link with the command.\n\nExample: .reddit https://www.reddit.com/r/videos/comments/...' 
        });
    }

    if (!isValidRedditUrl(url)) {
        return sock.sendMessage(chatId, {
            text: '❌ That is not a valid Reddit URL.'
        });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        const result = await getRedditMedia(url);

        if (!result.status || !result.url) {
            await sock.sendMessage(chatId, { text: `❌ ${result.error}` });
            return;
        }

        const caption = `🎬 *Reddit*\n${result.title}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ǫᴜᴇᴇɴ ʀɪᴀᴍ`;
        const content = result.mediaType === 'image'
            ? { image: { url: result.url }, caption }
            : { video: { url: result.url }, mimetype: 'video/mp4', caption };

        await sock.sendMessage(chatId, content, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (error) {
        console.error('[Reddit] Command failed:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Reddit download failed. The post may be unsupported or the downloader may be temporarily unavailable.'
        });
        try {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        } catch (_) {}
    }
}

bot({
    command: ['reddit'],
    description: 'Download Reddit video or image',
    category: 'download',
}, async (sock, chatId, message) => {
    await redditCommand(sock, chatId, message);
});
