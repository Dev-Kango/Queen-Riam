// Migrated from commands/alive.js

const settings = require("../settings");
const os = require("os");
const { readRandomBrandImage } = require('../lib/imagePicker');
const { isButtonModeOn, sendButtonMessage } = require("../lib/buttonHelper");
const { getLang } = require('../lib/lang');

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

async function aliveCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "❤️", key: message.key } });

        const t         = getLang(sock);
        const userName    = message.pushName || "User";
        const botUptime   = runtime(process.uptime());
        const totalMemory = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
        const freeMemory  = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
        const usedMemory  = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2);
        const host        = `${os.platform()} ${os.release()}`;
        const nodeVersion = process.version;

        const platformEmoji = {
            'win32': '🪟', 'darwin': '🍎', 'linux': '🐧', 'android': '🤖'
        }[os.platform()] || '💻';

        const greeting = t.alive_greeting.replace('{user}', userName);

        const aliveMessage =
            `👋 \`\`\` ${greeting} \`\`\`\n\n` +
            `_*${settings.botName || "Queen Riam"} ${t.alive_subtitle}*_\n\n` +
            `${t.alive_system_status}\n` +
            `> ${t.alive_version} ${settings.version}\n` +
            `> ${t.alive_memory} ${usedMemory}MB / ${totalMemory}GB\n` +
            `> ${t.alive_free} ${freeMemory}GB\n` +
            `> ${t.alive_runtime} ${botUptime}\n` +
            `> ${platformEmoji} ${t.alive_platform} ${host}\n` +
            `> ${t.alive_node} ${nodeVersion}\n\n` +
            `📢 Channel: https://whatsapp.com/channel/0029Va8YUl50bIdtVMYnYd0E\n\n` +
            `*${settings.botName || "Queen Riam"} ${t.alive_online}*\n\n` +
            `> ${t.alive_powered} ${settings.ownerName || "Héctor Manuel"} 👑`;

        if (isButtonModeOn()) {
            await sendButtonMessage(sock, chatId, {
                text: aliveMessage,
                footer: `${settings.botName || "Queen Riam"} 👑`,
                buttons: [
                    { id: '.ping', text: t.alive_ping_btn },
                ],
            }, message);
        } else {
            const imageBuffer = readRandomBrandImage();

            if (imageBuffer) {
                await sock.sendMessage(chatId, { image: imageBuffer, caption: aliveMessage });
            } else {
                await sock.sendMessage(chatId, { text: aliveMessage });
            }
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error("Error in alive command:", error);
        const t = getLang(sock);
        const errMsg = t.alive_error.replace('{runtime}', runtime(process.uptime()));
        await sock.sendMessage(chatId, {
            text: `🤖 *${settings.botName || "Queen Riam"} ${errMsg}*`
        });
        await sock.sendMessage(chatId, { react: { text: "⚠️", key: message.key } });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['alive'],
  description: 'Check if bot is online',
  category: 'general',
}, async (sock, chatId, message) => {
  await aliveCommand(sock, chatId, message);
});