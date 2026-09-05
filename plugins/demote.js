// Migrated from commands/demote.js

const isAdmin = require('../lib/isAdmin');
const { getLang } = require('../lib/lang');

async function demoteCommand(sock, chatId, mentionedJids, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: getLang(sock).common_groups_only });
            return;
        }

        try {
            const adminStatus = await isAdmin(sock, chatId, message.key.participant || message.key.remoteJid);
            if (!adminStatus.isBotAdmin) {
                await sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin });
                return;
            }
            if (!adminStatus.isSenderAdmin) {
                await sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, { text: getLang(sock).common_admin_check_failed });
            return;
        }

        let userToDemote = [];
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }

        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, { text: getLang(sock).demote_no_target });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");

        const usernames = userToDemote.map(jid => `@${jid.split('@')[0]}`);
        const senderJid = message.key.participant || message.key.remoteJid;
        const t = getLang(sock);

        const demotionMessage =
            `${t.demote_title}\n\n` +
            `${t.demote_label}\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `${t.demote_by} @${senderJid.split('@')[0]}\n\n` +
            `${t.demote_date} ${new Date().toLocaleString()}`;

        await new Promise(resolve => setTimeout(resolve, 1000));
        await sock.sendMessage(chatId, { text: demotionMessage, mentions: [...userToDemote, senderJid] });
    } catch (error) {
        console.error('Error in demote command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try { await sock.sendMessage(chatId, { text: getLang(sock).common_rate_limit }); } catch (_) {}
        } else {
            try { await sock.sendMessage(chatId, { text: getLang(sock).demote_failed }); } catch (_) {}
        }
    }
}

async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        if (!groupId || !participants) return;
        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotedUsernames = participants.map(jid => `@${jid.split('@')[0]}`);
        let demotedBy;
        let mentionList = [...participants];

        if (author && author.length > 0) {
            demotedBy = `@${author.split('@')[0]}`;
            mentionList.push(author);
        } else {
            demotedBy = 'System';
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        const t = getLang(sock);
        const demotionMessage =
            `${t.demote_title}\n\n` +
            `${t.demote_label}\n` +
            `${demotedUsernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `${t.demote_by} ${demotedBy}\n\n` +
            `${t.demote_date} ${new Date().toLocaleString()}`;

        await sock.sendMessage(groupId, { text: demotionMessage, mentions: mentionList });
    } catch (error) {
        console.error('Error handling demotion event:', error);
        if (error.data === 429) await new Promise(resolve => setTimeout(resolve, 2000));
    }
}





// ── Event handler self-registration ───────────────────────────────────────────
if (typeof global.bot === 'function') {
    global.bot({ on: 'group_update' }, async ({ sock, id, participants, action, author }) => {
        if (action !== 'demote') return;
        await handleDemotionEvent(sock, id, participants, author);
    });
}

module.exports = { handleDemotionEvent, demoteCommand };

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['demote'],
  description: 'Demote an admin to member',
  category: 'group',
}, async (sock, chatId, message) => {
  const jids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  await demoteCommand(sock, chatId, jids, message);
});