// Truecaller-style reverse phone lookup plugin.
// Usage:
//   .truecaller 233509977126        -> look up a number directly
//   .truecaller (tag/mention someone or reply to their message) -> look up that contact's number automatically
//
// NOTE on @lid: WhatsApp's privacy feature can expose a contact as a pseudonymous "@lid"
// id instead of their real phone-number "@s.whatsapp.net" jid. The digits in a @lid are
// NOT a phone number, so we resolve it back to the real number:
//   - In a private chat, the chat's own key carries `remoteJidAlt` — the real jid paired
//     with a `@lid` remoteJid (same pattern main.js uses for senderId).
//   - In a group, we resolve via the group's participant list, where `participant.phoneNumber`
//     is always the real @s.whatsapp.net jid (same pattern used in lib/isAdmin.js / lib/status.js).
const axios = require('axios');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { bot } = require('../lib/pluginLoader');

// NOTE: key is intentionally hardcoded per request.
const RAPIDAPI_KEY = '2363dba7e5mshba1766d6c57cf48p1aaef1jsnbabcced02282';

async function lookupNumber(code, number) {
    const headers = {
        'user-agent': 'Dart/3.7 (dart:io)',
        'x-rapidapi-host': 'callapp.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
        'accept-encoding': 'gzip',
        'host': 'callapp.p.rapidapi.com',
    };
    const { data } = await axios.get('https://callapp.p.rapidapi.com/api/v1/search', {
        params: { code, number },
        headers,
        timeout: 20000,
    });
    return data;
}

// Extracts the raw digits from a WhatsApp JID like '233509977126@s.whatsapp.net' or '233509977126:12@s.whatsapp.net'
function jidToDigits(jid) {
    if (!jid) return null;
    return jid.split('@')[0].split(':')[0];
}

function isRealNumberJid(jid) {
    return typeof jid === 'string' && jid.endsWith('@s.whatsapp.net');
}

// Resolves a (possibly @lid) target jid to the real @s.whatsapp.net jid when possible.
async function resolveRealJid(sock, chatId, isGroup, targetJid, message) {
    if (!targetJid) return null;
    if (isRealNumberJid(targetJid)) return targetJid;

    // Private chat: the only "other party" is the chat itself. message.key carries the
    // real-number pair (remoteJidAlt) alongside the pseudonymous remoteJid.
    if (!isGroup) {
        const key = message?.key || {};
        if (key.remoteJid === targetJid && isRealNumberJid(key.remoteJidAlt)) {
            return key.remoteJidAlt;
        }
        return targetJid;
    }

    // Group chat: look up the real number from the participant list.
    try {
        const meta = await sock.groupMetadata(chatId);
        const p = (meta.participants || []).find(
            (x) => x.id === targetJid || x.lid === targetJid
        );
        if (p) {
            if (p.phoneNumber && isRealNumberJid(p.phoneNumber)) return p.phoneNumber;
            if (p.phoneNumber) return p.phoneNumber + '@s.whatsapp.net';
            if (p.id && isRealNumberJid(p.id)) return p.id;
        }
    } catch (_) {
        // fall through to returning the original (likely @lid) jid
    }
    return targetJid;
}

// Parses any raw phone input (with/without +, spaces, dashes) into { code, number, full }
function parsePhone(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/[^\d+]/g, '');
    const withPlus = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    const parsed = parsePhoneNumberFromString(withPlus);
    if (!parsed || !parsed.isValid()) return null;
    return {
        code: String(parsed.countryCallingCode),
        number: parsed.nationalNumber,
        full: parsed.countryCallingCode + parsed.nationalNumber,
    };
}

function buildCard(fullNumber, result) {
    const d = (result && result.data) || {};
    const hasInfo = d.name || (Array.isArray(d.emails) && d.emails.length);

    const lines = [];
    lines.push('┌──「 *🔎 TRUECALLER LOOKUP* 」');
    lines.push('▢ *📱 Number:* +' + fullNumber);

    if (hasInfo) {
        if (d.name) lines.push('▢ *👤 Name:* ' + d.name);
        if (Array.isArray(d.emails) && d.emails.length) {
            lines.push('▢ *📧 Email:* ' + d.emails.map((e) => e.email).join(', '));
        }
        if (typeof d.spamScore !== 'undefined') {
            const spamLabel = d.spamScore > 0 ? `${d.spamScore} ⚠️` : `${d.spamScore} ✅`;
            lines.push('▢ *🚫 Spam Score:* ' + spamLabel);
        }
        if (typeof d.installedApp !== 'undefined') {
            lines.push('▢ *📲 Uses CallApp:* ' + (d.installedApp ? 'Yes' : 'No'));
        }
        if (typeof d.priority !== 'undefined') lines.push('▢ *⭐ Priority Score:* ' + d.priority);
    } else {
        lines.push('▢ *ℹ️ No caller details found for this number.*');
    }

    lines.push('└─────────────');
    lines.push('> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ǫᴜᴇᴇɴ ʀɪᴀᴍ');
    return lines.join('\n');
}

bot(
    {
        command: ['truecaller', 'tc', 'whois'],
        description: "Look up a phone number's caller ID info. Give a number, tag a contact, or reply to their message.",
        category: 'general',
    },
    async (sock, chatId, message, args, query, ctx) => {
        try {
            const msgCtx = message.message?.extendedTextMessage?.contextInfo;
            const mentioned = msgCtx?.mentionedJid?.[0];
            const participant = msgCtx?.participant;
            let targetJid = mentioned || participant;

            if (targetJid) {
                targetJid = await resolveRealJid(sock, chatId, ctx.isGroup, targetJid, message);
            }

            const typed = (query || '').trim();
            let source = null;

            if (typed) {
                source = typed;
            } else if (targetJid) {
                source = jidToDigits(targetJid);
            }

            if (!source) {
                await sock.sendMessage(
                    chatId,
                    {
                        text:
                            '📵 No number found.\n\n' +
                            `Usage:\n• ${ctx.effectivePrefix}truecaller 233509977126\n` +
                            `• Tag/mention a contact with ${ctx.effectivePrefix}truecaller\n` +
                            `• Reply to their message with ${ctx.effectivePrefix}truecaller`,
                    }
                );
                return;
            }

            const phone = parsePhone(source);
            if (!phone) {
                const hint = targetJid && !isRealNumberJid(targetJid)
                    ? " (couldn't resolve that contact's real number — WhatsApp is hiding it behind a privacy id; ask them to type their own number instead)"
                    : '';
                await sock.sendMessage(
                    chatId,
                    { text: '❌ Could not read a valid phone number (include the country code, e.g. 233509977126).' + hint }
                );
                return;
            }

            await sock.sendMessage(chatId, { react: { text: '🔎', key: message.key } });

            const result = await lookupNumber(phone.code, phone.number);

            if (!result || !result.status) {
                await sock.sendMessage(
                    chatId,
                    { text: '❌ Lookup failed: ' + (result?.message || 'no data returned for this number.') }
                );
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return;
            }

            const card = buildCard(phone.full, result);
            const mentions = targetJid ? [targetJid] : [];

            await sock.sendMessage(chatId, { text: card, mentions });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } catch (err) {
            console.error('[truecaller] Error:', err.message);
            await sock.sendMessage(
                chatId,
                { text: '❌ Truecaller lookup failed.\n_' + err.message + '_' }
            );
        }
    }
);
