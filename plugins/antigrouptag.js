// Migrated from commands/antigrouptag.js
const { hasOwnerPrivileges } = require('./sudo');

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

// ─── Self-contained storage (same pattern as lib/index.js) ───────────────────
function _ugdPath(sessionId) {
    return sessionId
        ? path.join(__dirname, '../data/userGroupData_' + sessionId + '.json')
        : path.join(__dirname, '../data/userGroupData.json');
}

function _load(sessionId) {
    try {
        const p = _ugdPath(sessionId);
        if (!fs.existsSync(p)) return {};
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { return {}; }
}

function _save(data, sessionId) {
    try {
        const p = _ugdPath(sessionId);
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
    } catch (e) { console.error('[antigrouptag] save error:', e.message); }
}

function setAntiGroupTag(groupId, action, sessionId) {
    const data = _load(sessionId);
    if (!data.antigrouptag) data.antigrouptag = {};
    data.antigrouptag[groupId] = { enabled: true, action: action || 'delete' };
    _save(data, sessionId);
}

function getAntiGroupTag(groupId, sessionId) {
    const data = _load(sessionId);
    return data.antigrouptag?.[groupId] || null;
}

function removeAntiGroupTag(groupId, sessionId) {
    const data = _load(sessionId);
    if (data.antigrouptag?.[groupId]) {
        delete data.antigrouptag[groupId];
        _save(data, sessionId);
    }
}

// ─── Command handler ──────────────────────────────────────────────────────────
async function handleAntiGroupTagCommand(sock, chatId, userMessage, isSenderAdmin) {
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' });
        return;
    }

    const sessionId = sock._sessionNumber || null;
    const args = userMessage.trim().split(/\s+/).slice(1);
    const first = args[0]?.toLowerCase();
    const second = args[1]?.toLowerCase();

    const usage = `\`\`\`ANTIGROUPTAG SETUP

Usage:
.antigrouptag           → see current status
.antigrouptag on        → enable (deletes status shares)
.antigrouptag delete on → delete status shares
.antigrouptag kick on   → kick + delete
.antigrouptag warn on   → warn + delete
.antigrouptag off       → disable\`\`\``;

    if (!first) {
        const current = getAntiGroupTag(chatId, sessionId);
        const status = current?.enabled ? 'ON' : 'OFF';
        const act = current?.action || 'delete';
        await sock.sendMessage(chatId, {
            text: `*Anti Group Tag:*\nStatus: *${status}*\nAction: *${act}*\n\n${usage}`
        });
        return;
    }

    if (first === 'off') {
        removeAntiGroupTag(chatId, sessionId);
        await sock.sendMessage(chatId, { text: '✅ *Anti Group Tag disabled.*' });
        return;
    }

    if (first === 'on') {
        setAntiGroupTag(chatId, 'delete', sessionId);
        await sock.sendMessage(chatId, {
            text: `✅ *Anti Group Tag enabled.*\nAction: *delete*\n\nStatus shares to this group will be deleted automatically.`
        });
        return;
    }

    const validActions = ['delete', 'kick', 'warn'];
    if (validActions.includes(first) && second === 'on') {
        setAntiGroupTag(chatId, first, sessionId);
        const desc = first === 'kick' ? 'kicked' : first === 'warn' ? 'warned' : 'have their message deleted';
        await sock.sendMessage(chatId, {
            text: `✅ *Anti Group Tag enabled.*\nAction: *${first}*\n\nAnyone who shares their status to this group will be ${desc}.`
        });
        return;
    }

    await sock.sendMessage(chatId, { text: usage });
}

// ─── Detection ────────────────────────────────────────────────────────────────
// Catches all ways WhatsApp delivers a "@ This group was mentioned" message:
//   - groupStatusMentionMessage  (status tag → group notification)
//   - groupMentionedMessage      (group mentioned message)
//   - statusMentionMessage       (status mention)
//   - any media/text whose contextInfo.remoteJid === 'status@broadcast'
//   - contextInfo.groupMentions  array present (newer WA versions)
async function handleGroupTagDetection(sock, chatId, message, senderId) {
    try {
        const msg = message.message;
        if (!msg) return false;

        const isGroupStatusMention  = !!(msg.groupStatusMentionMessage);
        const isGroupMentioned      = !!(msg.groupMentionedMessage);
        const isStatusMention       = !!(msg.statusMentionMessage);
        const hasStatusContext      = !!(
            msg.imageMessage?.contextInfo?.remoteJid === 'status@broadcast' ||
            msg.videoMessage?.contextInfo?.remoteJid === 'status@broadcast' ||
            msg.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast'
        );
        // Newer WhatsApp: groupMentions array in contextInfo of any message
        const hasGroupMentions = !!(
            msg.imageMessage?.contextInfo?.groupMentions?.length ||
            msg.videoMessage?.contextInfo?.groupMentions?.length ||
            msg.extendedTextMessage?.contextInfo?.groupMentions?.length ||
            msg.conversation && false // text-only won't have groupMentions
        );

        const isTagEvent = isGroupStatusMention || isGroupMentioned || isStatusMention || hasStatusContext || hasGroupMentions;
        if (!isTagEvent) return false;

        const sessionId = sock._sessionNumber || null;
        const setting = getAntiGroupTag(chatId, sessionId);
        if (!setting?.enabled) return false;

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (isSenderAdmin || message.key.fromMe) return true;
        if (!isBotAdmin) return true;

        const action = setting.action || 'delete';
        const mention = [senderId];
        const num = senderId.split('@')[0];

        // Always delete the message
        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: message.key.id, participant: senderId }
            });
        } catch (_) {}

        switch (action) {
            case 'kick':
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `👢 @${num} was removed for sharing their status to this group.`,
                    mentions: mention
                });
                break;
            case 'warn':
                await sock.sendMessage(chatId, {
                    text: `⚠️ @${num} Warning: Do not tag this group in your status!`,
                    mentions: mention
                });
                break;
            default:
                await sock.sendMessage(chatId, {
                    text: `🚫 @${num} Status tags are not allowed in this group.`,
                    mentions: mention
                });
        }

        return true;
    } catch (err) {
        console.error('[antigrouptag] Error:', err.message);
        return false;
    }
}





// ── Event handler self-registration ───────────────────────────────────────────
if (typeof global.bot === 'function') {
    global.bot({ on: 'message.group' }, async ({ sock, chatId, message, senderId }) => {
        await handleGroupTagDetection(sock, chatId, message, senderId);
    });
}

module.exports = { handleGroupTagDetection, handleAntiGroupTagCommand };

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['antigrouptag'],
  description: 'Toggle anti group-tag protection',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: '❌ Groups only.' }); return; }
  const isAdmin = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  if (!st.isSenderAdmin && !hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Admins only.' }); return; }
  await handleAntiGroupTagCommand(sock, chatId, ctx.userMessage, st.isSenderAdmin);
});