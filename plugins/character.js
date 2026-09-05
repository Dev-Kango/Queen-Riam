// Migrated from commands/character.js

const axios = require('axios');
const { getLang } = require('../lib/lang');

async function characterCommand(sock, chatId, message) {
    let userToAnalyze;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToAnalyze) {
        await sock.sendMessage(chatId, { 
            text: getLang(sock).character_no_target 
        });
        return;
    }

    try {
        // Get user's profile picture
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/ZMnWXCi.jpeg'; // Default image if no profile pic
        }

        const traits = [
            "Intelligent", "Creative", "Determined", "Ambitious", "Caring",
            "Charismatic", "Confident", "Empathetic", "Energetic", "Friendly",
            "Generous", "Honest", "Humorous", "Imaginative", "Independent",
            "Intuitive", "Kind", "Logical", "Loyal", "Optimistic",
            "Passionate", "Patient", "Persistent", "Reliable", "Resourceful",
            "Sincere", "Thoughtful", "Understanding", "Versatile", "Wise"
        ];

        // Get 3-5 random traits
        const numTraits = Math.floor(Math.random() * 3) + 3; // Random number between 3 and 5
        const selectedTraits = [];
        for (let i = 0; i < numTraits; i++) {
            const randomTrait = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(randomTrait)) {
                selectedTraits.push(randomTrait);
            }
        }

        // Calculate random percentages for each trait
        const traitPercentages = selectedTraits.map(trait => {
            const percentage = Math.floor(Math.random() * 41) + 60; // Random number between 60-100
            return `${trait}: ${percentage}%`;
        });

        // Create character analysis message
        const analysis = `🔮 *Character Analysis* 🔮\n\n` +
            `👤 *User:* ${userToAnalyze.split('@')[0]}\n\n` +
            `✨ *Key Traits:*\n${traitPercentages.join('\n')}\n\n` +
            `🎯 *Overall Rating:* ${Math.floor(Math.random() * 21) + 80}%\n\n` +
            `Note: This is a fun analysis and should not be taken seriously!`;

        // Send the analysis with the user's profile picture
        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: analysis,
            mentions: [userToAnalyze]
        });

    } catch (error) {
        console.error('Error in character command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).character_error 
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['character', 'crush'],
  description: 'Show anime character match',
  category: 'fun',
}, async (sock, chatId, message) => {
  await characterCommand(sock, chatId, message);
});