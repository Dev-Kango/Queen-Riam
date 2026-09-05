// Migrated from commands/antibadword.js

const { handleAntiBadwordCommand } = require('../lib/antibadword');
const isAdminHelper = require('../lib/isAdmin');
const { getLang } = require('../lib/lang');

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: `\`\`\`${getLang(sock).antibadword_admin_only}\`\`\`` });
            return;
        }

        // Extract match from message
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ');

        await handleAntiBadwordCommand(sock, chatId, message, match);
    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).antibadword_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['antibadword'],
  description: 'Toggle anti-badword filter',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'Groups only.' }); return; }
  const isAdmin        = require('../lib/isAdmin');
  const st = await isAdmin(sock, chatId, ctx.senderId);
  if (!st.isBotAdmin) { await sock.sendMessage(chatId, { text: '*Bot must be admin*' }); return; }
  await antibadwordCmd(sock, chatId, message, ctx.senderId, st.isSenderAdmin);
});