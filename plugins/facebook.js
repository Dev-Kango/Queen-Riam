// Migrated from commands/facebook.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadFacebook } = require('../lib/media');
const { toMp3 } = require('../lib/mp3converter');
const { getLang } = require('../lib/lang');

async function facebookCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation
            || message.message?.extendedTextMessage?.text
            || '';
        let url = text.split(' ').slice(1).join(' ').trim();

        // If no URL inline, try extracting one from the quoted/replied-to message
        if (!url) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = (
                quoted?.conversation ||
                quoted?.extendedTextMessage?.text ||
                quoted?.imageMessage?.caption ||
                quoted?.videoMessage?.caption ||
                ''
            ).trim();
            const match = quotedText.match(/https?:\/\/[^\s]+/);
            if (match) url = match[0];
        }

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: getLang(sock).dl_no_facebook
            });
        }

        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return await sock.sendMessage(chatId, {
                text: getLang(sock).dl_invalid_facebook
            });
        }

        // Loading reaction
        await sock.sendMessage(chatId, {
            react: { text: '⏳', key: message.key }
        });

        // Fetch video info via fbdown.to scrape
        const data = await downloadFacebook(url);
        const videoUrl = data.hdUrl || data.sdUrl;

        if (!videoUrl) {
            return await sock.sendMessage(chatId, {
                text: getLang(sock).dl_private_video
            });
        }

        // Download to temp file
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

        const videoRes = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Referer': 'https://www.facebook.com/'
            }
        });

        const writer = fs.createWriteStream(tempFile);
        videoRes.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
            throw new Error('Downloaded file is empty');
        }

        const caption = `*${data.title || 'Facebook Video'}*

${getLang(sock).facebook_caption}`;

        // Send video
        await sock.sendMessage(chatId, {
            video: { url: tempFile },
            mimetype: 'video/mp4',
            caption
        });

        // Extract and send audio
        try {
            const videoBuffer = fs.readFileSync(tempFile);
            const mp3 = await toMp3(videoBuffer, 'mp4');
            await sock.sendMessage(chatId, {
                audio: mp3.data,
                mimetype: 'audio/mpeg',
                ptt: false
            });
        } catch (audioErr) {
            console.error('[FB] Audio extraction failed:', audioErr.message);
            // Non-fatal — video was already sent
        }

        // Done reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Cleanup
        try { fs.unlinkSync(tempFile); } catch (_) {}

    } catch (error) {
        console.error('[FB] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: getLang(sock).facebook_error + '\n\n_' + error.message + '_'
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['facebook', 'fb'],
  description: 'Download Facebook video',
  category: 'download',
}, async (sock, chatId, message) => {
  await facebookCommand(sock, chatId, message);
});