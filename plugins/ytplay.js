// Migrated from commands/ytplay.js

const yts = require('yt-search');
const { getAudio } = require('../lib/media');
const { getLang } = require('../lib/lang');

async function ytplayCommand(sock, chatId, query, message) {
    if (!query) {
        return await sock.sendMessage(chatId, { text: getLang(sock).dl_no_youtube });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        let ytUrl = query;
        let searchTitle = '';
        let searchThumb = '';

        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const search = await yts(query);
            if (!search.videos || search.videos.length === 0) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, { text: `${getLang(sock).dl_no_results} ${query}` });
            }
            ytUrl = search.videos[0].url;
            searchTitle = search.videos[0].title;
            searchThumb = search.videos[0].thumbnail;
        }

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
        const { buffer, title, thumbnail } = await getAudio(ytUrl);

        await sock.sendMessage(chatId, { react: { text: '🎶', key: message.key } });
        const finalTitle = title || searchTitle || 'yt-audio';
        const finalThumb = thumbnail || searchThumb;

        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${finalTitle}.mp3`,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: finalTitle,
                    body: '🎶 Powered by Queen Riam',
                    thumbnailUrl: finalThumb,
                    sourceUrl: ytUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('YTPlay Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: getLang(sock).dl_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ytplay'],
  description: 'Play YouTube video',
  category: 'download',
}, async (sock, chatId, message, args, query) => {
  await ytplayCommand(sock, chatId, query, message);
});