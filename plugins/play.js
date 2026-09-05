// Migrated from commands/play.js
const yts = require('yt-search');
const { getAudio } = require('../lib/media');
const { getLang } = require('../lib/lang');

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: getLang(sock).dl_no_song
            });
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { text: '' + getLang(sock).dl_no_results + '' });
        }

        const video = videos[0];

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 *${video.title}*\n${getLang(sock).dl_duration} ${video.timestamp}\n${getLang(sock).dl_views} ${video.views.toLocaleString()}\n\n${getLang(sock).dl_downloading} 🎶\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ǫᴜᴇᴇɴ ʀɪᴀᴍ`
        });

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
        const { buffer, title } = await getAudio(video.url);

        await sock.sendMessage(chatId, { react: { text: '🎶', key: message.key } });
        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${title || video.title}.mp3`,
            ptt: false
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Error in playCommand:', error.message);
        if (error.message?.includes('Connection Closed') || error.message?.includes('Connection Terminated')) return;
        try {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, { text: getLang(sock).dl_failed });
        } catch (_) {}
    }
}

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['playaudio'],
  description: 'Download audio from YouTube with extended details',
  category: 'general',
}, async (sock, chatId, message, args, query, ctx) => {
  await playCommand(sock, chatId, message, args, query, ctx);
});
