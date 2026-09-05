// Migrated from commands/antilink.js

const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const { getLang } = require('../lib/lang');

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, canManage) {
    try {
        if (!canManage) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' });
            return;
        }

        const prefix = '.'; // You might want to make this dynamic from settings
        const args = userMessage.slice(prefix.length + 8).toLowerCase().trim().split(' ');
        const action = args[0];
        const status = args[1];

        const usage = `\`\`\`ANTILINK SETUP\n\nUsage:\n${prefix}antilink\n(to see current status)\n${prefix}antilink [kick|delete|warn] on\n${prefix}antilink [kick|delete|warn] off\n\`\`\``;

        if (!action) {
            const currentConfig = await getAntilink(chatId, 'on', sock._sessionNumber || null);
            const currentStatus = currentConfig && currentConfig.enabled ? 'ON' : 'OFF';
            const currentAction = currentConfig && currentConfig.action ? currentConfig.action : 'delete (default)';

            await sock.sendMessage(chatId, {
                text: `*_Antilink Configuration:_*` +
                    `\nStatus: *${currentStatus}*` +
                    `\nAction: *${currentAction}*\n\n` +
                    usage
            });
            return;
        }

        const validActions = ['kick', 'delete', 'warn'];
        if (!validActions.includes(action)) {
            await sock.sendMessage(chatId, { text: getLang(sock).antilink_invalid_action });
            return;
        }

        if (status === 'on') {
            const result = await setAntilink(chatId, 'on', action, sock._sessionNumber || null);
            if (result) {
                await sock.sendMessage(chatId, {
                    text: `${getLang(sock).antilink_turned_on.replace('{action}', action)}`
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: getLang(sock).antilink_failed_on
                });
            }
        } else if (status === 'off') {
            await removeAntilink(chatId, 'on', sock._sessionNumber || null);
            await sock.sendMessage(chatId, { text: getLang(sock).antilink_turned_off });
        } else {
            await sock.sendMessage(chatId, { text: usage });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).antilink_error });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const antilinkSetting = await getAntilink(chatId, 'on', sock._sessionNumber || null);
        if (!antilinkSetting || !antilinkSetting.enabled) {
            return false; // No antilink enabled for this group
        }

        const action = antilinkSetting.action || 'delete'; // Default to delete if not set

        const linkPatterns = [
            /https?:\/\/[^\s]+/i,
            /www\.[^\s]+/i,
            /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            /t\.me\/[A-Za-z0-9_]+/i,
            /(?:^|\s)(?:[a-z0-9-]+\.)+(?:com|net|org|io|ly|co|me|app|dev|xyz|info|online|site)(?:\/[^\s]*)?/i,
        ];

        const isLinkDetected = linkPatterns.some(pattern => pattern.test(userMessage));

        if (isLinkDetected) {
            console.log(`🔗 Antilink detected! Action: ${action}, From: ${senderId}`);

            // Check if sender is admin
            const adminStatus = await isAdmin(sock, chatId, senderId);
            const isSenderAdmin = adminStatus.isSenderAdmin;
            const isBotAdmin = adminStatus.isBotAdmin;

            // Skip if sender is admin, bot itself, or bot isn't admin
            if (isSenderAdmin || message.key.fromMe || !isBotAdmin) {
                console.log(`⏩ Skipping antilink action (admin/self/bot not admin)`);
                return true;
            }

            const mentionedJidList = [senderId];
            
            // The bot needs to be an admin to perform any action.
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'I need to be an admin to enforce antilink rules.' });
                return true;
            }

            switch (action) {
                case 'delete':
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
                        console.log(`🗑️ Message with ID ${message.key.id} deleted successfully.`);
                    } catch (error) {
                        console.error('Failed to delete message:', error);
                    }
                    break;
                case 'kick':
                    try {
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                        await sock.sendMessage(chatId, { text: `User @${senderId.split('@')[0]} has been kicked for posting a link.`, mentions: mentionedJidList });
                        console.log(`👢 User ${senderId} kicked successfully.`);
                    } catch (error) {
                        console.error('Failed to kick user:', error);
                        await sock.sendMessage(chatId, { text: `Failed to kick @${senderId.split('@')[0]}. I might not have the necessary permissions.`, mentions: mentionedJidList });
                    }
                    break;
                case 'warn':
                    await sock.sendMessage(chatId, { text: `@${senderId.split('@')[0]} has been warned for posting a link.`, mentions: mentionedJidList });
                    console.log(`⚠️ User ${senderId} warned.`);
                    break;
            }
            return true; // A link was detected and handled
        } else {
            console.log('No link detected.');
            return false; // No link was detected
        }
    } catch (error) {
        console.error('Error in handleLinkDetection:', error);
        return false;
    }
}





// ── Event handler self-registration ───────────────────────────────────────────
if (typeof global.bot === 'function') {
    global.bot({ on: 'message.group_text' }, async ({ sock, chatId, message, userMessage, senderId }) => {
        await handleLinkDetection(sock, chatId, message, userMessage, senderId);
    });
}

module.exports = { handleLinkDetection, handleAntilinkCommand };

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['antilink'],
  description: 'Toggle anti-link protection',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: '❌ Groups only.' }); return; }
  const isAdmin = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  const canManage = st.isSenderAdmin;
  if (!canManage) { await sock.sendMessage(chatId, { text: '❌ Only group admins can change antilink settings.' }); return; }
  await handleAntilinkCommand(sock, chatId, ctx.userMessage, ctx.senderId, canManage);
});