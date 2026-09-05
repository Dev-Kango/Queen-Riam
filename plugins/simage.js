// Migrated from commands/simage.js

const sharp = require('sharp');
const fs = require('fs');
const fsPromises = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getLang } = require('../lib/lang');

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const scheduleFileDeletion = (filePath) => {
    setTimeout(async () => {
        try {
            await fse.remove(filePath);
            console.log(`File deleted: ${filePath}`);
        } catch (error) {
            console.error(`Failed to delete file:`, error);
        }
    }, 10000); // 5 minutes
};

const convertStickerToImage = async (sock, quotedMessage, chatId) => {
    try {
        const stickerMessage = quotedMessage.stickerMessage;
        if (!stickerMessage) {
            await sock.sendMessage(chatId, { text: getLang(sock).simage_no_sticker });
            return;
        }

        const stickerFilePath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputImagePath = path.join(tempDir, `converted_image_${Date.now()}.png`);

        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await fsPromises.writeFile(stickerFilePath, buffer);
        await sharp(stickerFilePath).toFormat('png').toFile(outputImagePath);

        const imageBuffer = await fsPromises.readFile(outputImagePath);
        await sock.sendMessage(chatId, { image: imageBuffer, caption: getLang(sock).simage_converted });

        scheduleFileDeletion(stickerFilePath);
        scheduleFileDeletion(outputImagePath);
    } catch (error) {
        console.error('Error converting sticker to image:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).simage_error });
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['simage'],
  description: 'Convert sticker to image',
  category: 'photo',
}, async (sock, chatId, message, args, query, ctx) => {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.stickerMessage) {
    await simageCommand(sock, quoted, chatId);
  } else {
    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with ' + ctx.effectivePrefix + 'simage.' });
  }
});