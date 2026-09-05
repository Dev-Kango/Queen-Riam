// Migrated from commands/kick.js
const { hasOwnerPrivileges } = require('./sudo');

const isAdmin = require('../lib/isAdmin');

const { getLang } = require('../lib/lang');
async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    // Check if user is owner
    const isOwner = hasOwnerPrivileges(senderId, message, sock.user?.id, sock._sessionNumber);
    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin });
            return;
        }
    }

    let usersToKick = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, { 
            text: getLang(sock).kick_no_target
        });
        return;
    }

    // Get bot's ID
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Check if any of the users to kick is the bot itself
    if (usersToKick.includes(botId)) {
        await sock.sendMessage(chatId, { 
            text: getLang(sock).kick_self
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
        
        // Get usernames for each kicked user
        const usernames = await Promise.all(usersToKick.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));
        
        await sock.sendMessage(chatId, { 
            text: `${usernames.join(', ')} has been kicked successfully!`,
            mentions: usersToKick
        });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).kick_failed
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['kick'],
  description: 'Kick a member from group',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  const jids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  await kickCommand(sock, chatId, ctx.senderId, jids, message);
});