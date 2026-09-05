// Migrated from commands/staff.js

const fs = require('fs');
const { getRandomBrandImagePath } = require('../lib/imagePicker');

const { getLang } = require('../lib/lang');
async function staffCommand(sock, chatId, msg) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: getLang(sock).staff_groups_only });
        }

        const groupMetadata = await sock.groupMetadata(chatId);

        // Try group picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            // Local fallback
            pp = getRandomBrandImagePath();
        }

        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n▢ ') || getLang(sock).staff_no_admins;

        const owner = groupMetadata.owner 
            || groupAdmins.find(p => p.admin === 'superadmin')?.id 
            || chatId.split('-')[0] + '@s.whatsapp.net';

        const text = `
≡ *GROUP ADMINS* _${groupMetadata.subject}_

┌─⊷ *ADMINS*
▢ ${listAdmin}
└───────────
`.trim();

        const mentions = [...new Set([...groupAdmins.map(v => v.id), owner])];

        await sock.sendMessage(chatId, {
            image: fs.existsSync(pp) ? { url: pp } : { url: pp }, // local file if exists
            caption: text,
            mentions
        });

    } catch (error) {
        console.error('Error in staff command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).staff_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['staff', 'admins', 'listadmin'],
  description: 'List group admins',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'Groups only!' }); return; }
  await staffCommand(sock, chatId, message);
});