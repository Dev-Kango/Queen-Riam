'use strict';

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { bot } = require('../lib/pluginLoader');

const PROTECTION_KEYS = [
    'antispam',
    'anticontact',
    'antiaudio',
    'antiimage',
    'antivideo',
    'antisticker',
    'antimedia',
    'antibot',
    'antivirus',
];

const DEFAULTS = Object.fromEntries(PROTECTION_KEYS.map(key => [key, false]));
const MEDIA_KINDS = new Set(['contact', 'audio', 'image', 'video', 'sticker', 'document']);
const SPAM_WINDOW_MS = 10_000;
const SPAM_LIMIT = 8;
const NOTICE_COOLDOWN_MS = 30_000;

const spamBuckets = new Map();
const noticeCooldowns = new Map();

function dataPath(sock) {
    const session = sock && sock._sessionNumber != null
        ? String(sock._sessionNumber).replace(/[^0-9A-Za-z_-]/g, '')
        : '';
    return path.join(__dirname, '..', 'data', session ? `userGroupData_${session}.json` : 'userGroupData.json');
}

function loadData(sock) {
    try {
        const file = dataPath(sock);
        if (!fs.existsSync(file)) return {};
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        console.error('[groupProtection] could not load settings:', error.message);
        return {};
    }
}

function saveData(sock, data) {
    const file = dataPath(sock);
    const temp = `${file}.tmp`;
    try {
        fs.writeFileSync(temp, JSON.stringify(data, null, 2));
        fs.renameSync(temp, file);
    } catch (error) {
        try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) {}
        console.error('[groupProtection] could not save settings:', error.message);
    }
}

function getSettings(sock, groupId) {
    const data = loadData(sock);
    return { ...DEFAULTS, ...(data.groupProtection?.[groupId] || {}) };
}

function setSetting(sock, groupId, key, enabled) {
    const data = loadData(sock);
    if (!data.groupProtection) data.groupProtection = {};
    if (!data.groupProtection[groupId]) data.groupProtection[groupId] = {};
    data.groupProtection[groupId][key] = enabled;
    saveData(sock, data);
}

function unwrapMessageContent(message) {
    let current = message;
    for (let i = 0; i < 6; i += 1) {
        const nested = current?.ephemeralMessage?.message
            || current?.viewOnceMessage?.message
            || current?.viewOnceMessageV2?.message
            || current?.viewOnceMessageV2Extension?.message
            || current?.documentWithCaptionMessage?.message;
        if (!nested) return current || {};
        current = nested;
    }
    return current || {};
}

function getMessageKind(message) {
    const content = unwrapMessageContent(message?.message);
    if (content.contactMessage || content.contactsArrayMessage) return 'contact';
    if (content.audioMessage) return 'audio';
    if (content.imageMessage) return 'image';
    if (content.videoMessage) return 'video';
    if (content.stickerMessage) return 'sticker';
    if (content.documentMessage) return 'document';
    return 'other';
}

function isPotentiallyUnsafeFile(message) {
    const content = unwrapMessageContent(message?.message);
    const document = content.documentMessage;
    if (!document) return false;

    const fileName = String(document.fileName || '');
    const mimeType = String(document.mimetype || '').toLowerCase();
    const dangerousName = /\.(apk|appx|bat|cmd|com|cpl|dll|dmg|exe|jar|js|jse|msi|ps1|scr|sh|vbe|vbs|wsf|wsc|hta)(?:$|\?)/i.test(fileName);
    const dangerousMime = /(?:x-msdownload|x-dosexec|android\.package-archive|java-archive|x-sh|x-bat|x-cmd|x-sql|javascript)/i.test(mimeType);
    return dangerousName || dangerousMime;
}

function looksLikeBotMessage(message, isBot) {
    if (isBot === true || message?.key?.isBot === true || message?.key?.bot === true) return true;
    const id = String(message?.key?.id || '');
    return (id.startsWith('3EB0') && id.length === 12)
        || (id.startsWith('BAAE') && id.length === 16);
}

function spamDetected(groupId, senderId, sessionId) {
    const key = `${sessionId || 'main'}:${groupId}:${senderId}`;
    const now = Date.now();
    const cutoff = now - SPAM_WINDOW_MS;
    const recent = (spamBuckets.get(key) || []).filter(timestamp => timestamp >= cutoff);
    recent.push(now);
    spamBuckets.set(key, recent);
    return recent.length > SPAM_LIMIT;
}

async function deleteMessage(sock, chatId, message, senderId) {
    try {
        const originalKey = message.key || {};
        const deleteKey = {
            ...originalKey,
            remoteJid: chatId,
            fromMe: false,
            id: originalKey.id,
            participant: senderId || originalKey.participant,
        };
        await sock.sendMessage(chatId, { delete: deleteKey });
        return true;
    } catch (error) {
        console.error('[groupProtection] could not delete message:', error.message);
        return false;
    }
}

async function sendNotice(sock, chatId, senderId, protection, message) {
    const key = `${chatId}:${protection}`;
    const now = Date.now();
    const lastNotice = noticeCooldowns.get(key) || 0;
    if (now - lastNotice < NOTICE_COOLDOWN_MS) return;
    noticeCooldowns.set(key, now);

    const number = String(senderId || '').split('@')[0];
    const mention = number ? `@${number}` : 'That member';
    const text = protection === 'antispam'
        ? `⚠️ ${mention}, please slow down. Repeated messages are not allowed here.`
        : protection === 'antivirus'
            ? `🛡️ ${mention}, potentially unsafe files are not allowed in this group.`
            : `🚫 ${mention}, ${message} messages are not allowed in this group.`;

    await sock.sendMessage(chatId, {
        text,
        mentions: number ? [senderId] : [],
    });
}

async function enforceGroupProtections({ sock, chatId, message, senderId, sessionNumber, isBot }) {
    if (!chatId?.endsWith('@g.us') || !message?.message || message.key?.fromMe) return;

    const settings = getSettings(sock, chatId);
    if (!PROTECTION_KEYS.some(key => settings[key])) return;

    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (adminStatus.isSenderAdmin || !adminStatus.isBotAdmin) return;

    let protection = null;
    let noticeLabel = null;
    const kind = getMessageKind(message);

    if (settings.antispam && spamDetected(chatId, senderId, sessionNumber)) {
        protection = 'antispam';
    } else if (settings.antibot && looksLikeBotMessage(message, isBot)) {
        protection = 'antibot';
        noticeLabel = 'automated bot';
    } else if (settings.antivirus && isPotentiallyUnsafeFile(message)) {
        protection = 'antivirus';
    } else if (settings.antimedia && MEDIA_KINDS.has(kind)) {
        protection = 'antimedia';
        noticeLabel = kind;
    } else if (settings[`anti${kind}`]) {
        protection = `anti${kind}`;
        noticeLabel = kind;
    }

    if (!protection) return;
    const deleted = await deleteMessage(sock, chatId, message, senderId);
    if (deleted) await sendNotice(sock, chatId, senderId, protection, noticeLabel || protection.replace(/^anti/, ''));
}

async function protectionCommand(sock, chatId, message, args, query, ctx) {
    if (!ctx.isGroup) {
        await sock.sendMessage(chatId, { text: '❌ This protection can only be used in a group.' });
        return;
    }

    const key = ctx.c;
    const state = String(args[0] || '').toLowerCase();
    const current = getSettings(sock, chatId)[key];

    if (!state || state === 'status') {
        await sock.sendMessage(chatId, {
            text: `🛡️ *${key}* is currently *${current ? 'ON' : 'OFF'}* in this group.\n\nUse ${ctx.effectivePrefix}${key} on or ${ctx.effectivePrefix}${key} off`,
        });
        return;
    }

    if (!['on', 'off'].includes(state)) {
        await sock.sendMessage(chatId, {
            text: `Usage: ${ctx.effectivePrefix}${key} on | off`,
        });
        return;
    }

    const adminStatus = await isAdmin(sock, chatId, ctx.senderId);
    if (!adminStatus.isBotAdmin) {
        await sock.sendMessage(chatId, { text: '❌ I need to be a group admin to enforce this protection.' });
        return;
    }
    if (!adminStatus.isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can change this protection.' });
        return;
    }

    const enabled = state === 'on';
    setSetting(sock, chatId, key, enabled);
    await sock.sendMessage(chatId, {
        text: `✅ *${key}* is now *${enabled ? 'ON' : 'OFF'}* in this group.`,
    });
}

if (typeof global.bot === 'function') {
    global.bot({ on: 'message.group' }, enforceGroupProtections);
}

bot({
    command: PROTECTION_KEYS,
    menuCommands: PROTECTION_KEYS,
    description: 'Configure group protection controls',
    category: 'group',
}, protectionCommand);

module.exports = {
    enforceGroupProtections,
    getMessageKind,
    isPotentiallyUnsafeFile,
};
