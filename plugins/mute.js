// Migrated from commands/mute.js

const isAdmin = require('../lib/isAdmin');

const { getLang } = require('../lib/lang');
async function muteCommand(sock, chatId, senderId, durationInMinutes) {
    console.log(`Attempting to mute the group for ${durationInMinutes} minutes.`); // Log for debugging

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin });
        return;
    }

    const durationInMilliseconds = durationInMinutes * 60 * 1000;
    try {
        await sock.groupSettingUpdate(chatId, 'announcement'); // Mute the group
        await sock.sendMessage(chatId, { text: `The group has been muted for ${durationInMinutes} minutes.` });

        setTimeout(async () => {
            await sock.groupSettingUpdate(chatId, 'not_announcement'); // Unmute after the duration
            await sock.sendMessage(chatId, { text: getLang(sock).mute_unmuted });
        }, durationInMilliseconds);
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).mute_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['mute'],
  description: 'Mute a member',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  const mins = parseInt(args[0]);
  if (isNaN(mins)) {
    await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'mute <minutes>' });
  } else {
    await muteCommand(sock, chatId, ctx.senderId, mins);
  }
});