// Migrated from commands/resetlink.js

const { getLang } = require('../lib/lang');
async function resetlinkCommand(sock, chatId, senderId) {
    try {
        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(senderId);

        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: getLang(sock).resetlink_admin_only });
            return;
        }

        // Reset the group link
        const newCode = await sock.groupRevokeInvite(chatId);
        
        // Send the new link
        await sock.sendMessage(chatId, { 
            text: `✅ Group link has been successfully reset\n\n📌 New link:\nhttps://chat.whatsapp.com/${newCode}`
        });

    } catch (error) {
        console.error('Error in resetlink command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).resetlink_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['resetlink', 'revoke', 'anularlink'],
  description: 'Reset group invite link',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'Groups only!' }); return; }
  await resetlinkCommand(sock, chatId, ctx.senderId);
});