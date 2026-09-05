// Migrated from commands/newsletter.js

const settings = require('../settings');
const https = require('https');
const http = require('http');

function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, { timeout: 10000 }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function formatSubscribers(count) {
    if (!count && count !== 0) return 'N/A';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000)     return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
        timeZone: settings.timezone || 'UTC'
    });
}

// Parse any input into { type: 'invite'|'jid', key: string }
function parseInput(raw) {
    const s = raw.trim();

    // Full channel link — extract exactly what's after /channel/
    const linkMatch = s.match(/whatsapp\.com\/channel\/([A-Za-z0-9_\-]+)/i);
    if (linkMatch) return { type: 'invite', key: linkMatch[1] };

    // Raw JID like 120363404284793169@newsletter
    const jidMatch = s.match(/^(\d+@newsletter)$/i);
    if (jidMatch) return { type: 'jid', key: jidMatch[1] };

    // Bare invite code (no domain, no @)
    if (/^[A-Za-z0-9_\-]{10,}$/.test(s) && !s.includes('@')) {
        return { type: 'invite', key: s };
    }

    return null;
}

async function fetchMeta(sock, type, key) {
    try {
        const meta = await sock.newsletterMetadata(type, key);
        if (meta) return { meta, error: null };
    } catch (err) {
        return { meta: null, error: err };
    }
    return { meta: null, error: new Error('No data returned') };
}

async function newsletterCommand(sock, chatId, message, body) {
    const args = body.trim().split(/\s+/).slice(1).join(' ').trim();

    if (!args) {
        await sock.sendMessage(chatId, {
            text:
                `📢 *Channel Info Command*\n\n` +
                `Send a WhatsApp channel link or JID to fetch full info.\n\n` +
                `*Examples:*\n` +
                `• ${settings.prefix}newsletter https://whatsapp.com/channel/XXXX\n` +
                `• ${settings.prefix}newsletter 120363404284793169@newsletter`
        });
        return;
    }

    const parsed = parseInput(args);

    if (!parsed) {
        await sock.sendMessage(chatId, {
            text:
                `❌ *Invalid input format.*\n\n` +
                `Please send one of:\n` +
                `• A WhatsApp channel link\n` +
                `  _https://whatsapp.com/channel/..._\n` +
                `• A channel JID\n` +
                `  _120363404284793169@newsletter_`
        });
        return;
    }

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

    console.log(`[newsletter] Fetching type=${parsed.type} key=${parsed.key}`);

    let { meta, error } = await fetchMeta(sock, parsed.type, parsed.key);

    // If invite failed, give a very specific error message
    if (!meta && error) {
        const errMsg = error.message || '';
        let userErr;

        if (errMsg.toLowerCase().includes('bad request') || errMsg.includes('400')) {
            userErr =
                `❌ *Channel not found.*\n\n` +
                `WhatsApp channel links are *case-sensitive* — the link must be copied exactly as shared in WhatsApp. Typing it manually often changes the case and breaks it.\n\n` +
                `💡 *How to get the correct link:*\n` +
                `1. Open the channel in WhatsApp\n` +
                `2. Tap the channel name → *Invite to Channel*\n` +
                `3. Copy that exact link and send it here\n\n` +
                `Or use the channel JID directly:\n` +
                `${settings.prefix}newsletter 120363404284793169@newsletter`;
        } else if (errMsg.toLowerCase().includes('not-authorized') || errMsg.includes('403')) {
            userErr =
                `❌ *This channel is private or restricted.*\n\n` +
                `The bot needs to be a subscriber or admin of the channel to fetch its info.`;
        } else {
            userErr = `❌ *Could not fetch channel info.*\n\n_${errMsg}_`;
        }

        await sock.sendMessage(chatId, { text: userErr });
        return;
    }

    // Build the channel JID for the profile picture lookup
    const channelJid  = meta.id || (parsed.type === 'jid' ? parsed.key : null);
    const name        = meta.name || 'Unknown';
    const description = meta.description || '_No description_';
    const subscribers = formatSubscribers(meta.subscribers);
    const createdOn   = formatDate(meta.creation_time || meta.thread_metadata?.creation_time);
    const verification = meta.verification === 'VERIFIED' ? '✅ Verified' : '❌ Not Verified';
    const inviteLink  = meta.invite
        ? `https://whatsapp.com/channel/${meta.invite}`
        : (parsed.type === 'invite' ? `https://whatsapp.com/channel/${parsed.key}` : 'N/A');

    const caption =
        `╔══════════════════╗\n` +
        `║  📢 *CHANNEL INFO*\n` +
        `╚══════════════════╝\n\n` +
        `📛 *Name:* ${name}\n` +
        `${verification}\n` +
        `👥 *Subscribers:* ${subscribers}\n` +
        `📅 *Created:* ${createdOn}\n` +
        `📝 *Description:*\n${description}\n\n` +
        `🔗 *Channel Link:*\n${inviteLink}\n` +
        (channelJid ? `🆔 *JID:* \`${channelJid}\`` : '');

    // Try profile picture
    let picBuffer = null;
    if (channelJid) {
        try {
            const picUrl = await sock.profilePictureUrl(channelJid, 'image');
            if (picUrl) picBuffer = await fetchImageBuffer(picUrl);
        } catch (_) { /* no pic */ }
    }

    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    if (picBuffer) {
        await sock.sendMessage(chatId, {
            image: picBuffer,
            caption
        });
    } else {
        await sock.sendMessage(chatId, {
            text: caption
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['newsletter'],
  description: 'Manage newsletter',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  await newsletterCommand(sock, chatId, message, ctx.userMessage);
});