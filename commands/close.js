const isAdmin = require('../lib/isAdmin');
const getFakeVcard = require('../lib/fakeVcard');

const { getLang } = require('../lib/lang');
async function closeGroupCommand(sock, chatId, senderId, message) {
    console.log(`Attempting to close the group: ${chatId}`);

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin }, { quoted: getFakeVcard() });
    }

    if (!isSenderAdmin) {
        return sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin }, { quoted: getFakeVcard() });
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement'); // Close group
        await sock.sendMessage(chatId, { text: getLang(sock).close_success });
    } catch (error) {
        console.error('Error closing group:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).close_failed });
    }
}
async function newCommands(sock, chatId, senderId, message, text) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    // Group Name Change
    if (message.body.startsWith('.setname')) {
        if (!isBotAdmin) return sock.sendMessage(chatId, { text: '⚠️ Bot ko admin banayein!' });
        if (!isSenderAdmin) return sock.sendMessage(chatId, { text: '❌ Sirf admins naya naam rakh sakte hain.' });
        const newName = message.body.slice(9);
        if (!newName) return sock.sendMessage(chatId, { text: 'Naya naam toh likhein!' });
        await sock.groupUpdateSubject(chatId, newName);
        await sock.sendMessage(chatId, { text: `✅ Naam badal kar *${newName}* kar diya gaya.` });
    }

    // Spam Command
    if (message.body.startsWith('.spam')) {
        const args = message.body.slice(6).split('|');
        const count = parseInt(args[0]);
        const spamMsg = args[1];
        if (isNaN(count) || count > 20) return sock.sendMessage(chatId, { text: 'Limit 20 rakhein!' });
        for (let i = 0; i < count; i++) {
            await sock.sendMessage(chatId, { text: spamMsg });
        }
    }
}

module.exports = { closeGroupCommand, newCommands };
