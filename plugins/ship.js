// Migrated from commands/ship.js

const { getLang } = require('../lib/lang');
async function shipCommand(sock, chatId, msg, groupMetadata) {
    try {
        // Get all participants from the group
        const participants = await sock.groupMetadata(chatId);
        const ps = participants.participants.map(v => v.id);
        
        // Get two random participants
        let firstUser, secondUser;
        
        // Select first random user
        firstUser = ps[Math.floor(Math.random() * ps.length)];
        
        // Select second random user (different from first)
        do {
            secondUser = ps[Math.floor(Math.random() * ps.length)];
        } while (secondUser === firstUser);

        // Format the mentions
        const formatMention = id => '@' + id.split('@')[0];

        // Create and send the ship message
        await sock.sendMessage(chatId, {
            text: `${formatMention(firstUser)} ❤️ ${formatMention(secondUser)}\nCongratulations 💖🍻`,
            mentions: [firstUser, secondUser]
        });

    } catch (error) {
        console.error('Error in ship command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).ship_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ship'],
  description: 'Ship two people',
  category: 'fun',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups!' }); return; }
  await shipCommand(sock, chatId, message);
});