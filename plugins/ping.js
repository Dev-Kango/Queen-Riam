// Migrated from commands/ping.js

const os = require("os");
const { performance } = require("perf_hooks");
const settings = require("../settings.js");
const { isButtonModeOn, sendButtonMessage } = require("../lib/buttonHelper");
const { getLang } = require('../lib/lang');

function formatBytes(bytes) {
    if (bytes === 0) return "0B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

async function pingCommand(sock, chatId, message) {
    try {
        const t = getLang(sock);
        const start = performance.now();
        await sock.sendMessage(chatId, { text: t.ping_pong });
        const latency = ((performance.now() - start) / 1000).toFixed(4);

        const cpus = os.cpus();
        const cpu = cpus.reduce(
            (acc, c) => {
                const total = Object.values(c.times).reduce((a, b) => a + b, 0);
                acc.total += total;
                acc.speed += c.speed;
                Object.keys(c.times).forEach(key => acc.times[key] += c.times[key]);
                return acc;
            },
            { speed: 0, total: 0, times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } }
        );

        const ramUsage = `${formatBytes(os.totalmem() - os.freemem())} / ${formatBytes(os.totalmem())}`;
        const response =
            `*${t.ping_pong}*\n` +
            `${t.ping_response} *${latency}* ${t.ping_seconds}\n\n` +
            `*💻 ${settings.botName || "Queen Riam"}* ${t.ping_server_info}\n` +
            `${t.ping_ram} *${ramUsage}*\n` +
            `${t.ping_cores} *${cpus.length}*\n` +
            `${t.ping_speed} *${(cpu.speed / cpus.length).toFixed(2)} MHz*`;

        if (isButtonModeOn()) {
            await sendButtonMessage(sock, chatId, {
                text: response,
                footer: `${settings.botName || "Queen Riam"} 👑`,
                buttons: [
                    { id: '.alive', text: t.ping_alive_btn },
                ],
            }, message);
        } else {
            await sock.sendMessage(chatId, { text: response });
        }

    } catch (error) {
        console.error("Error in ping command:", error);
        await sock.sendMessage(chatId, { text: getLang(sock).ping_failed });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ping'],
  description: 'Check bot response speed',
  category: 'general',
}, async (sock, chatId, message) => {
  await pingCommand(sock, chatId, message);
});