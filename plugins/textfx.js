// Migrated from commands/textmaker.js

const axios = require('axios');
const mumaker = require('mumaker');
const { getLang } = require('../lib/lang');

async function textmakerCommand(sock, chatId, message, q, type) {
    try {
        let usageErrorText;
        switch (type) {
            case 'metallic':
                usageErrorText = "Example: .metallic Hector";
                break;
            case 'ice':
                usageErrorText = "Example: .ice Hector";
                break;
            case 'snow':
                usageErrorText = "Example: .snow Hector";
                break;
            case 'impressive':
                usageErrorText = "Example: .impressive Hector";
                break;
            case 'matrix':
                usageErrorText = "Example: .matrix Hector";
                break;
            case 'light':
                usageErrorText = "Example: .light Hector";
                break;
            case 'neon':
                usageErrorText = "Example: .neon Hector";
                break;
            case 'devil':
                usageErrorText = "Example: .devil Hector";
                break;
            case 'purple':
                usageErrorText = "Example: .purple Hector";
                break;
            case 'thunder':
                usageErrorText = "Example: .thunder Hector";
                break;
            case 'leaves':
                usageErrorText = "Example: .leaves Hector";
                break;
            case '1917':
                usageErrorText = "Example: .1917 Hector";
                break;
            case 'arena':
                usageErrorText = "Example: .arena Hector";
                break;
            case 'hacker':
                usageErrorText = "Example: .hacker Hector";
                break;
            case 'sand':
                usageErrorText = "Example: .sand Hector";
                break;
            case 'blackpink':
                usageErrorText = "Example: .blackpink Hector";
                break;
            case 'glitch':
                usageErrorText = "Example: .glitch Hector";
                break;
            case 'fire':
                usageErrorText = "Example: .fire Hector";
                break;
            default:
                usageErrorText = "Invalid text generator type.";
        }

        const text = q.split(' ').slice(1).join(' ');

        if (!text) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return await sock.sendMessage(chatId, {
                text: getLang(sock).textmaker_no_text + ' ' + usageErrorText
            });
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

        let result;
        const ephotoBaseUrl = "https://en.ephoto360.com";
        let specificUrl = "";

        switch (type) {
            case 'metallic':
                specificUrl = `${ephotoBaseUrl}/impressive-decorative-3d-metal-text-effect-798.html`;
                break;
            case 'ice':
                specificUrl = `${ephotoBaseUrl}/ice-text-effect-online-101.html`;
                break;
            case 'snow':
                specificUrl = `${ephotoBaseUrl}/create-a-snow-3d-text-effect-free-online-621.html`;
                break;
            case 'impressive':
                specificUrl = `${ephotoBaseUrl}/create-3d-colorful-paint-text-effect-online-801.html`;
                break;
            case 'matrix':
                specificUrl = `${ephotoBaseUrl}/matrix-text-effect-154.html`;
                break;
            case 'light':
                specificUrl = `${ephotoBaseUrl}/light-text-effect-futuristic-technology-style-648.html`;
                break;
            case 'neon':
                specificUrl = `${ephotoBaseUrl}/create-colorful-neon-light-text-effects-online-797.html`;
                break;
            case 'devil':
                specificUrl = `${ephotoBaseUrl}/neon-devil-wings-text-effect-online-683.html`;
                break;
            case 'purple':
                specificUrl = `${ephotoBaseUrl}/purple-text-effect-online-100.html`;
                break;
            case 'thunder':
                specificUrl = `${ephotoBaseUrl}/thunder-text-effect-online-97.html`;
                break;
            case 'leaves':
                specificUrl = `${ephotoBaseUrl}/green-brush-text-effect-typography-maker-online-153.html`;
                break;
            case '1917':
                specificUrl = `${ephotoBaseUrl}/1917-style-text-effect-523.html`;
                break;
            case 'arena':
                specificUrl = `${ephotoBaseUrl}/create-cover-arena-of-valor-by-mastering-360.html`;
                break;
            case 'hacker':
                specificUrl = `${ephotoBaseUrl}/create-anonymous-hacker-avatars-cyan-neon-677.html`;
                break;
            case 'sand':
                specificUrl = `${ephotoBaseUrl}/write-names-and-messages-on-the-sand-online-582.html`;
                break;
            case 'blackpink':
                specificUrl = `${ephotoBaseUrl}/create-a-blackpink-style-logo-with-members-signatures-810.html`;
                break;
            case 'glitch':
                specificUrl = `${ephotoBaseUrl}/create-digital-glitch-text-effects-online-767.html`;
                break;
            case 'fire':
                specificUrl = `${ephotoBaseUrl}/flame-lettering-effect-372.html`;
                break;
            default:
                await sock.sendMessage(chatId, {
                    text: getLang(sock).textmaker_invalid_type
                });
                return;
        }

        try {
            result = await mumaker.ephoto(specificUrl, text);

            if (!result || !result.image) {
                await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
                throw new Error('No image URL received from the API');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: getLang(sock).textmaker_caption
            });
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        } catch (error) {
            console.error(`Error in text generator for type ${type}:`, error);
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            await sock.sendMessage(chatId, {
                text: getLang(sock).textmaker_error + ' Usage: ' + usageErrorText
            });
        }
    } catch (error) {
        console.error('Error in textmaker command:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, {
            text: getLang(sock).textmaker_unexpected
        });
    }
}


const FX = ['metallic','ice','snow','impressive','matrix','light','neon','devil',
            'purple','thunder','leaves','1917','arena','hacker','sand','blackpink','glitch','fire'];

for (const fxName of FX) {
  bot({
    command: [fxName],
    description: fxName.charAt(0).toUpperCase() + fxName.slice(1) + ' text effect',
    category: 'text',
  }, async (sock, chatId, message, args, query, ctx) => {
    await textmakerCommand(sock, chatId, message, ctx.userMessage, fxName);
  });
}
