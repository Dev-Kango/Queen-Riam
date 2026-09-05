// Migrated from commands/ban.js

const fs = require('fs');
const { getLang } = require('../lib/lang');

function _bannedFile(sock){const sid=sock&&sock._sessionNumber?sock._sessionNumber:null;return sid?require('path').join(__dirname,'../data/banned_'+sid+'.json'):require('path').join(__dirname,'../data/banned.json');}

async function banCommand(sock, chatId, message) {
    let userToBan;

    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToBan) {
        await sock.sendMessage(chatId, { text: getLang(sock).ban_no_target });
        return;
    }

    try {
        const BAN_FILE=_bannedFile(sock);const bannedUsers=fs.existsSync(BAN_FILE)?JSON.parse(fs.readFileSync(BAN_FILE)):[];
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync(BAN_FILE, JSON.stringify(bannedUsers, null, 2));

            await sock.sendMessage(chatId, {
                text: getLang(sock).ban_success.replace('@{user}', `@${userToBan.split('@')[0]}`),
                mentions: [userToBan]
            });
        } else {
            await sock.sendMessage(chatId, {
                text: getLang(sock).ban_already.replace('@{user}', `@${userToBan.split('@')[0]}`),
                mentions: [userToBan]
            });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).ban_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ban'],
  description: 'Ban a member from group',
  category: 'group',
}, async (sock, chatId, message) => {
  await banCommand(sock, chatId, message);
});