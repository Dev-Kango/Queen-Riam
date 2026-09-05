// Migrated from commands/video.js

const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getVideo } = require('../lib/media');
const { getLang } = require('../lib/lang');

// Convert any video to H.264/AAC MP4 (required by WhatsApp)
function convertToH264(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '28',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            outputPath
        ]);
        ff.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error('ffmpeg exited with code ' + code));
        });
        ff.on('error', reject);
    });
}

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, { text: getLang(sock).dl_no_video });
        }

        let ytUrl = '';
        let previewTitle = '';
        let previewThumbnail = '';

        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            ytUrl = searchQuery;
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return await sock.sendMessage(chatId, { text: getLang(sock).dl_no_results });
            }
            ytUrl = videos[0].url;
            previewTitle = videos[0].title;
            previewThumbnail = videos[0].thumbnail;
        }

        const urlMatch = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
        if (!urlMatch) {
            return await sock.sendMessage(chatId, { text: getLang(sock).dl_invalid_youtube });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const { fileUrl, title, thumbnail } = await getVideo(ytUrl, '360p');

        const finalTitle = title || previewTitle || 'video';
        const finalThumb = thumbnail || previewThumbnail;
        const safeName = finalTitle.replace(/[^a-zA-Z0-9-_\.]/g, '_');

        await sock.sendMessage(chatId, {
            image: { url: finalThumb },
            caption: '🎬 *' + finalTitle + '*\n' + getLang(sock).dl_quality + ' 360p\n\n> _' + getLang(sock).video_downloading + '_'
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const stamp = Date.now();
        const rawFile = path.join(tempDir, stamp + '_raw.mp4');
        const outFile = path.join(tempDir, stamp + '_out.mp4');

        try {
            // Download raw video
            const videoRes = await axios.get(fileUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            fs.writeFileSync(rawFile, Buffer.from(videoRes.data));

            // Re-encode to H.264/AAC so WhatsApp can play it
            await convertToH264(rawFile, outFile);

            const stats = fs.statSync(outFile);
            if (stats.size > 62 * 1024 * 1024) {
                return await sock.sendMessage(chatId, { text: getLang(sock).dl_too_large });
            }

            await sock.sendMessage(chatId, {
                video: fs.readFileSync(outFile),
                mimetype: 'video/mp4',
                fileName: safeName + '.mp4',
                caption: '*' + finalTitle + '*\n' + getLang(sock).dl_quality + ' 360p\n\n> *_Downloaded by Queen Riam_*'
            });

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        } finally {
            setTimeout(() => {
                try { if (fs.existsSync(rawFile)) fs.unlinkSync(rawFile); } catch {}
                try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch {}
            }, 5000);
        }

    } catch (error) {
        console.error('[video.js] Error:', error.message);
        await sock.sendMessage(chatId, { text: '❌ Download failed. Please try again later.' });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['video', 'ytmp4'],
  description: 'Download video from YouTube',
  category: 'download',
}, async (sock, chatId, message) => {
  await videoCommand(sock, chatId, message);
});