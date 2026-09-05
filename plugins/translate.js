// Migrated from commands/translate.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

const languageCodes = {
    fr: "French",
    es: "Spanish",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi"
};
async function translateCommand(sock, chatId, message, match) {
    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        // Case 1: If it's a reply
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            textToTranslate =
                quotedMessage.conversation ||
                quotedMessage.extendedTextMessage?.text ||
                quotedMessage.imageMessage?.caption ||
                quotedMessage.videoMessage?.caption ||
                '';

            lang = match.trim();
        } 
        // Case 2: Direct input
        else {
            const args = match.trim().split(' ');
            if (args.length < 2) {
                const available = Object.entries(languageCodes)
                    .map(([code, name]) => `▫️ ${code} = ${name}`)
                    .join("\n");

                return sock.sendMessage(chatId, {
                    text: getLang(sock).translate_usage + `\n\nExample:\n.translate hello fr\n.trt hello es\n\n📋 Available Codes:\n${available}`,
                    quoted: message
                });
            }

            lang = args.pop(); // last word is language code
            textToTranslate = args.join(' '); // rest is text
        }

        if (!textToTranslate) {
            return sock.sendMessage(chatId, {
                text: getLang(sock).translate_no_text,
                quoted: message
            });
        }

        // Try multiple translation APIs
        let translatedText = null;

        // API 1 - Google Translate
        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (res.ok) {
                const data = await res.json();
                if (data?.[0]?.[0]?.[0]) translatedText = data[0][0][0];
            }
        } catch {}

        // API 2 - MyMemory
        if (!translatedText) {
            try {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.responseData?.translatedText) translatedText = data.responseData.translatedText;
                }
            } catch {}
        }

        // API 3 - Backup API
        if (!translatedText) {
            try {
                const res = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.translated) translatedText = data.translated;
                }
            } catch {}
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // Send translation result
        await sock.sendMessage(chatId, {
            text: getLang(sock).translate_header.replace('{lang}', lang) + '\n\n' + translatedText,
        });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).translate_failed,
            quoted: message
        });
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['translate'],
  description: 'Translate text',
  category: 'tools',
}, async (sock, chatId, message, args, query) => {
  await handleTranslateCommand(sock, chatId, message, query);
});