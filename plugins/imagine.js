// Migrated from commands/imagine.js

const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');
const { getLang } = require('../lib/lang');

async function imagineCommand(sock, chatId, message) {
    try {
        // Get the prompt from the message
        const prompt = message.message?.conversation?.trim() || 
                      message.message?.extendedTextMessage?.text?.trim() || '';
        
        // Remove the command prefix and trim
        const imagePrompt = prompt.slice(8).trim();
        
        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: getLang(sock).imagine_no_prompt
            }, {
                quoted: message
            });
            return;
        }

        // Send processing message
        await sock.sendMessage(chatId, {
            text: getLang(sock).imagine_generating
        }, {
            quoted: message
        });

        // Enhance the prompt with quality keywords
        const enhancedPrompt = enhancePrompt(imagePrompt);

        // Make API request
        const response = await axios.get(`https://api.shizo.top/ai/imagine/flux`, {
            params: {
                apikey: 'knightbot',
                prompt: enhancedPrompt
            },
            responseType: 'arraybuffer'
        });

        // Convert response to buffer
        const imageBuffer = Buffer.from(response.data);

        // Send the generated image
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: getLang(sock).imagine_caption.replace('{prompt}', imagePrompt)
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Error in imagine command:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).imagine_failed
        }, {
            quoted: message
        });
    }
}

// Function to enhance the prompt
function enhancePrompt(prompt) {
    // Quality enhancing keywords
    const qualityEnhancers = [
        'high quality',
        'detailed',
        'masterpiece',
        'best quality',
        'ultra realistic',
        '4k',
        'highly detailed',
        'professional photography',
        'cinematic lighting',
        'sharp focus'
    ];

    // Randomly select 3-4 enhancers
    const numEnhancers = Math.floor(Math.random() * 2) + 3; // Random number between 3-4
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    // Combine original prompt with enhancers
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['imagine', 'flux', 'dalle'],
  description: 'Generate AI image',
  category: 'ai',
}, async (sock, chatId, message) => {
  await imagineCommand(sock, chatId, message);
});