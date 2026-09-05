// Migrated from commands/tagall.js

const { getLang } = require('../lib/lang');
const isAdmin = require('../lib/isAdmin');

async function tagAllCommand(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            await sock.sendMessage(chatId, { text: getLang(sock).tagall_no_members });
            return;
        }

        const t = getLang(sock);
        let message = t.tagall_header;
        participants.forEach(participant => {
            message += `@${participant.id.split('@')[0]}\n`;
        });

        await sock.sendMessage(chatId, {
            text: message,
            mentions: participants.map(p => p.id)
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).tagall_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['tagall'],
  description: 'Tag all group members',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  await tagAllCommand(sock, chatId, ctx.senderId, message);
});