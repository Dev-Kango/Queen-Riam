// Migrated from commands/promote.js

const { isAdmin } = require('../lib/isAdmin');
const { getLang } = require('../lib/lang');

async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];

    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { text: getLang(sock).promote_no_target });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");

        const usernames = userToPromote.map(jid => `@${jid.split('@')[0]}`);
        const promoterJid = sock.user.id;
        const t = getLang(sock);

        const promotionMessage =
            `${t.promote_title}\n\n` +
            `${t.promote_label}\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `${t.promote_by} @${promoterJid.split('@')[0]}\n\n` +
            `${t.promote_date} ${new Date().toLocaleString()}`;

        await sock.sendMessage(chatId, {
            text: promotionMessage,
            mentions: [...userToPromote, promoterJid]
        });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).promote_failed });
    }
}

async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        const promotedUsernames = participants.map(jid => `@${jid.split('@')[0]} `);
        let promotedBy;
        let mentionList = [...participants];

        if (author && author.length > 0) {
            promotedBy = `@${author.split('@')[0]}`;
            mentionList.push(author);
        } else {
            promotedBy = 'System';
        }

        const t = getLang(sock);
        const promotionMessage =
            `${t.promote_title}\n\n` +
            `${t.promote_label}\n` +
            `${promotedUsernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `${t.promote_by} ${promotedBy}\n\n` +
            `${t.promote_date} ${new Date().toLocaleString()}`;

        await sock.sendMessage(groupId, { text: promotionMessage, mentions: mentionList });
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}





// ── Event handler self-registration ───────────────────────────────────────────
if (typeof global.bot === 'function') {
    global.bot({ on: 'group_update' }, async ({ sock, id, participants, action, author }) => {
        if (action !== 'promote') return;
        await handlePromotionEvent(sock, id, participants, author);
    });
}

module.exports = { handlePromotionEvent, promoteCommand };

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['promote'],
  description: 'Promote a member to admin',
  category: 'group',
}, async (sock, chatId, message) => {
  const jids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  await promoteCommand(sock, chatId, jids, message);
});