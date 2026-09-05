// Migrated from commands/warnings.js

const fs = require('fs');
const path = require('path');

const { getLang } = require('../lib/lang');
function _warningsFile(sock){const sid=sock&&sock._sessionNumber?sock._sessionNumber:null;return sid?require('path').join(__dirname,'../data/warnings_'+sid+'.json'):require('path').join(__dirname,'../data/warnings.json');}

function loadWarnings(sock) {
    const f=_warningsFile(sock);
    if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify({}), 'utf8');
    return JSON.parse(fs.readFileSync(f, 'utf8'));
}

async function warningsCommand(sock, chatId, mentionedJidList) {
    const warnings = loadWarnings(sock);

    if (mentionedJidList.length === 0) {
        await sock.sendMessage(chatId, { text: getLang(sock).warnings_no_mention });
        return;
    }

    const userToCheck = mentionedJidList[0];
    const warningCount = warnings[userToCheck] || 0;

    await sock.sendMessage(chatId, { text: getLang(sock).warnings_count.replace('{count}', warningCount) });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['warnings'],
  description: 'Check warnings for a member',
  category: 'group',
}, async (sock, chatId, message) => {
  const jids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  await warningsCommand(sock, chatId, jids);
});