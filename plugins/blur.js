// Migrated from commands/img-blur.js

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const sharp = require('sharp');
const { getLang } = require('../lib/lang');

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        // Get the image to blur
        let imageBuffer;
        
        if (quotedMessage) {
            // If replying to a message
            if (!quotedMessage.imageMessage) {
                await sock.sendMessage(chatId, { 
                    text: getLang(sock).blur_no_image 
                });
                return;
            }
            
            const quoted = {
                message: {
                    imageMessage: quotedMessage.imageMessage
                }
            };
            
            imageBuffer = await downloadMediaMessage(
                quoted,
                'buffer',
                { },
                { }
            );
        } else if (message.message?.imageMessage) {
            // If image is in current message
            imageBuffer = await downloadMediaMessage(
                message,
                'buffer',
                { },
                { }
            );
        } else {
            await sock.sendMessage(chatId, { 
                text: getLang(sock).blur_no_image 
            });
            return;
        }

        // Resize and optimize image
        const resizedImage = await sharp(imageBuffer)
            .resize(800, 800, { // Resize to max 800x800
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
            .toBuffer();

        // Apply blur effect directly using sharp
        const blurredImage = await sharp(resizedImage)
            .blur(10) // Blur radius of 10
            .toBuffer();

        // Send the blurred image
        await sock.sendMessage(chatId, {
            image: blurredImage,
            caption: getLang(sock).blur_success
        });

    } catch (error) {
        console.error('Error in blur command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).blur_failed 
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['blur'],
  description: 'Blur an image',
  category: 'photo',
}, async (sock, chatId, message) => {
  await blurCommand(sock, chatId, message, message.message?.extendedTextMessage?.contextInfo?.quotedMessage);
});