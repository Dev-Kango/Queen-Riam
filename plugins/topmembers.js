// Migrated from commands/topmembers.js

const fs = require('fs');
const path = require('path');
const { getLang } = require('../lib/lang');

function _mcFile(sessionId){return sessionId?path.join(__dirname,'..','data','messageCount_'+sessionId+'.json'):path.join(__dirname,'..','data','messageCount.json');}
function loadMessageCounts(sessionId) {
    const f=_mcFile(sessionId);
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f));
    return {};
}
function saveMessageCounts(messageCounts, sessionId) {
    fs.writeFileSync(_mcFile(sessionId), JSON.stringify(messageCounts, null, 2));
}
function incrementMessageCount(groupId, userId, sessionId) {
    const messageCounts = loadMessageCounts(sessionId);

    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {};
    }

    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0;
    }

    messageCounts[groupId][userId] += 1;

    saveMessageCounts(messageCounts, sessionId);
}

function topMembers(sock, chatId, isGroup) {
    const sessionId = sock && sock._sessionNumber ? sock._sessionNumber : null;
    if (!isGroup) {
        sock.sendMessage(chatId, { text: getLang(sock).topmembers_groups_only });
        return;
    }

    const messageCounts = loadMessageCounts(sessionId);
    const groupCounts = messageCounts[chatId] || {};

    const sortedMembers = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Get top 5 members

    if (sortedMembers.length === 0) {
        sock.sendMessage(chatId, { text: getLang(sock).topmembers_no_activity });
        return;
    }

    let message = getLang(sock).topmembers_header;
    sortedMembers.forEach(([userId, count], index) => {
        message += `${index + 1}. @${userId.split('@')[0]} - ${count} messages\n`;
    });

    sock.sendMessage(chatId, { text: message, mentions: sortedMembers.map(([userId]) => userId) });
}





// ── Event handler self-registration ───────────────────────────────────────────
if (typeof global.bot === 'function') {
    global.bot({ on: 'message.count' }, async ({ chatId, senderId, sessionNumber, fromMe }) => {
        if (!fromMe) incrementMessageCount(chatId, senderId, sessionNumber);
    });
}

module.exports = { incrementMessageCount, topMembers };

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['topmembers'],
  description: 'Show most active members',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  topMembers(sock, chatId, ctx.isGroup);
});