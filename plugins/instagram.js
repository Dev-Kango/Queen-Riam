// Migrated from commands/instagram.js

const { igdl } = require("ruhend-scraper");
const { getLang } = require('../lib/lang');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function instagramCommand(sock, chatId, message) {
    try {
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        // ✅ Step 1: Get text from command message
        let directText =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            "";

        // Remove ".ig" or ".instagram" prefix if command used
        const args = directText.trim().split(" ").slice(1).join(" ");
        let url = args.trim();

        // ✅ Step 2: If no args, fallback to quoted message text
        if (!url && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
            url =
                quoted.conversation ||
                quoted.extendedTextMessage?.text ||
                quoted.imageMessage?.caption ||
                quoted.videoMessage?.caption ||
                "";
            url = url.trim();
        }

        // ✅ Step 3: If still no text
        if (!url) {
            return await sock.sendMessage(
                chatId,
                { text: getLang(sock).dl_no_instagram }
            );
        }

        // ✅ Step 4: Validate Instagram link
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//,
            /https?:\/\/(?:www\.)?instagram\.com\/p\//,
            /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
            /https?:\/\/(?:www\.)?instagram\.com\/tv\//
        ];

        const isValidUrl = instagramPatterns.some((pattern) => pattern.test(url));
        if (!isValidUrl) {
            return await sock.sendMessage(
                chatId,
                { text: getLang(sock).dl_invalid_instagram }
            );
        }

        // React 🔄 while processing
        await sock.sendMessage(chatId, { react: { text: "🔄", key: message.key } });

        // ✅ Step 5: Fetch media
        const downloadData = await igdl(url);
        if (!downloadData?.data?.length) {
            return await sock.sendMessage(
                chatId,
                { text: getLang(sock).dl_no_media }
            );
        }

        const caption = getLang(sock).instagram_caption;

        for (let i = 0; i < Math.min(20, downloadData.data.length); i++) {
            const media = downloadData.data[i];
            const mediaUrl = media.url;

            const isVideo =
                /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
                media.type === "video" ||
                url.includes("/reel/") ||
                url.includes("/tv/");

            if (isVideo) {
                await sock.sendMessage(
                    chatId,
                    {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption
                    }
                );
            } else {
                await sock.sendMessage(
                    chatId,
                    {
                        image: { url: mediaUrl },
                        caption
                    }
                );
            }
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
    } catch (error) {
        console.error("Error in Instagram command:", error);
        await sock.sendMessage(
            chatId,
            { text: getLang(sock).common_error }
        );
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['instagram', 'insta', 'ig'],
  description: 'Download Instagram media',
  category: 'download',
}, async (sock, chatId, message) => {
  await instagramCommand(sock, chatId, message);
});