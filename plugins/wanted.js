// Migrated from commands/wanted.js

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const https = require('https');
const http = require('http');
const settings = require('../settings');
const { getLang } = require('../lib/lang');

async function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, { timeout: 10000 }, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function makeWantedPoster(photoBuffer) {
    const W = 580, H = 820;
    const faceSize = 370;
    const faceX = Math.round((W - faceSize) / 2);
    const faceY = 155;
    const lineY1 = faceY - 15;
    const lineY2 = faceY + faceSize + 18;
    const rewardY = lineY2 + 58;
    const amountY = rewardY + 52;
    const foot1Y = H - 42;
    const foot2Y = H - 22;

    // Resize & crop the photo to a square
    const faceBuffer = await sharp(photoBuffer)
        .resize(faceSize, faceSize, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer();

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Parchment background -->
  <rect width="${W}" height="${H}" fill="#c8a458"/>

  <!-- Texture overlay lines for aged look -->
  ${Array.from({ length: 40 }, (_, i) =>
    `<line x1="0" y1="${i * 21}" x2="${W}" y2="${i * 21 + 5}" stroke="#b8913e" stroke-width="1.2" opacity="0.4"/>`
  ).join('\n  ')}

  <!-- Outer thick border -->
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}"
        fill="none" stroke="#3d1f00" stroke-width="9"/>
  <!-- Inner thin border -->
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}"
        fill="none" stroke="#3d1f00" stroke-width="2.5"/>

  <!-- Corner ornaments -->
  <text x="26" y="46" font-size="22" fill="#3d1f00" font-family="serif">✦</text>
  <text x="${W - 46}" y="46" font-size="22" fill="#3d1f00" font-family="serif">✦</text>
  <text x="26" y="${H - 22}" font-size="22" fill="#3d1f00" font-family="serif">✦</text>
  <text x="${W - 46}" y="${H - 22}" font-size="22" fill="#3d1f00" font-family="serif">✦</text>

  <!-- WANTED heading -->
  <text x="${W / 2}" y="100" text-anchor="middle"
        font-family="Georgia, serif" font-size="94" font-weight="bold"
        fill="#1a0500" letter-spacing="6">WANTED</text>

  <!-- DEAD OR ALIVE -->
  <text x="${W / 2}" y="135" text-anchor="middle"
        font-family="Georgia, serif" font-size="26" font-weight="bold"
        fill="#7a1000" letter-spacing="5">DEAD OR ALIVE</text>

  <!-- Decorative line above photo -->
  <line x1="35" y1="${lineY1}" x2="${W - 35}" y2="${lineY1}"
        stroke="#3d1f00" stroke-width="2"/>

  <!-- Photo border (black frame) -->
  <rect x="${faceX - 5}" y="${faceY - 5}" width="${faceSize + 10}" height="${faceSize + 10}"
        fill="#1a0500" stroke="#3d1f00" stroke-width="3"/>

  <!-- Decorative line below photo -->
  <line x1="35" y1="${lineY2}" x2="${W - 35}" y2="${lineY2}"
        stroke="#3d1f00" stroke-width="2"/>

  <!-- Double line accent -->
  <line x1="35" y1="${lineY2 + 5}" x2="${W - 35}" y2="${lineY2 + 5}"
        stroke="#3d1f00" stroke-width="1"/>

  <!-- REWARD -->
  <text x="${W / 2}" y="${rewardY}" text-anchor="middle"
        font-family="Georgia, serif" font-size="42" font-weight="bold"
        fill="#1a0500" letter-spacing="4">REWARD</text>

  <!-- Reward amount -->
  <text x="${W / 2}" y="${amountY}" text-anchor="middle"
        font-family="Georgia, serif" font-size="46" font-weight="bold"
        fill="#7a1000">$1,000,000</text>

  <!-- Footer text -->
  <text x="${W / 2}" y="${foot1Y}" text-anchor="middle"
        font-family="Georgia, serif" font-size="14" fill="#3d1f00" letter-spacing="1">
    FOR INFORMATION LEADING TO CAPTURE
  </text>
  <text x="${W / 2}" y="${foot2Y}" text-anchor="middle"
        font-family="Georgia, serif" font-size="12" fill="#3d1f00">
    CONTACT YOUR LOCAL AUTHORITY
  </text>
</svg>`;

    const poster = await sharp({
        create: { width: W, height: H, channels: 3, background: { r: 200, g: 164, b: 88 } }
    })
    .composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
        { input: faceBuffer, top: faceY, left: faceX }
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

    return poster;
}

async function wantedCommand(sock, chatId, message) {
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = ctx?.mentionedJid?.[0];
    const quotedMsg = ctx?.quotedMessage;
    const quotedParticipant = ctx?.participant;

    let photoBuffer = null;
    let targetUser = null;

    // Priority 1: quoted message has image/video → use that media
    if (quotedMsg) {
        const qType = Object.keys(quotedMsg)[0];
        if (qType === 'imageMessage' || qType === 'videoMessage') {
            try {
                photoBuffer = await downloadMediaMessage(
                    { message: quotedMsg },
                    'buffer',
                    {},
                    { logger: sock.logger, reuploadRequest: sock.updateMediaMessage }
                );
            } catch (e) {
                console.warn('[wanted] quoted media download failed:', e.message);
            }
        }
        // If quoted message had no media, fetch the sender's profile pic
        if (!photoBuffer && quotedParticipant) {
            targetUser = quotedParticipant;
        }
    }

    // Priority 2: mentioned user → fetch their profile pic
    if (!photoBuffer && !targetUser && mentionedJid) {
        targetUser = mentionedJid;
    }

    // Fetch profile pic if we have a target but no image yet
    if (!photoBuffer && targetUser) {
        try {
            const picUrl = await sock.profilePictureUrl(targetUser, 'image');
            photoBuffer = await fetchImageBuffer(picUrl);
        } catch (e) {
            await sock.sendMessage(chatId, {
                text: getLang(sock).wanted_no_pic
            });
            return;
        }
    }

    // Nothing to work with
    if (!photoBuffer) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).wanted_usage
        });
        return;
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🤠', key: message.key } });

        const poster = await makeWantedPoster(photoBuffer);

        const caption = targetUser
            ? `🤠 *WANTED*\n@${targetUser.split('@')[0]}`
            : `🤠 *WANTED*`;

        await sock.sendMessage(chatId, {
            image: poster,
            caption,
            mentions: targetUser ? [targetUser] : []
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[wanted] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: getLang(sock).wanted_error + ': ' + err.message
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['wanted'],
  description: 'Create a wanted poster',
  category: 'photo',
}, async (sock, chatId, message) => {
  await wantedCommand(sock, chatId, message);
});