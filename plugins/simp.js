// Migrated from commands/simp.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

async function simpCommand(sock, chatId, quotedMsg, mentionedJid, sender) {
    try {
        // Determine the target user
        let who = quotedMsg 
            ? quotedMsg.sender 
            : mentionedJid && mentionedJid[0] 
                ? mentionedJid[0] 
                : sender;

        // Get the profile picture URL
        let avatarUrl;
        try {
            avatarUrl = await sock.profilePictureUrl(who, 'image');
        } catch (error) {
            console.error('Error fetching profile picture:', error);
            avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // Default avatar
        }

        // Fetch the simp card from the API
        const apiUrl = `https://some-random-api.com/canvas/misc/simpcard?avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        // Get the image buffer
        const imageBuffer = await response.buffer();

        // Send the image with caption
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: '> Your Dump ✨'
        });

    } catch (error) {
        console.error('Error in simp command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).simp_error
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['simp'],
  description: 'Simp rate meter',
  category: 'fun',
}, async (sock, chatId, message, args, query, ctx) => {
  const qm   = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const jids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  await simpCommand(sock, chatId, qm, jids, ctx.senderId);
});