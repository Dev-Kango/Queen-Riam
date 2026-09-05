// Migrated from commands/buttonmode.js

const { loadConfig, saveConfig } = require('../lib/config');
const { isButtonModeOn, sendButtonMessage } = require('../lib/buttonHelper');
const { getLang } = require('../lib/lang');
async function buttonmodeCommand(sock, chatId, message, args) {
    const cfg = loadConfig();
    const arg = args[0]?.toLowerCase();

    if (!arg || !['on', 'off'].includes(arg)) {
        const current = cfg.BUTTONMODE === 'on' ? 'ON ✅' : 'OFF ❌';
        const text =
            `🔘 *Button Mode*\n\n` +
            `Current status: *${current}*\n\n` +
            `_When ON, the bot sends interactive tap-buttons with responses.\n` +
            `When OFF, the bot responds with plain text as normal._`;

        if (isButtonModeOn()) {
            await sendButtonMessage(sock, chatId, {
                text,
                footer: 'Queen Riam 👑',
                buttons: [
                    { id: '.buttonmode on',  text: getLang(sock).btn_turn_on  },
                    { id: '.buttonmode off', text: getLang(sock).btn_turn_off },
                ],
            }, message);
        } else {
            await sock.sendMessage(chatId, { text });
        }
        return;
    }

    cfg.BUTTONMODE = arg;
    saveConfig(cfg);

    const label = arg === 'on' ? '✅ ON' : '❌ OFF';
    const note  = arg === 'on'
        ? '_Interactive buttons will now appear on supported commands._'
        : '_Bot will respond with plain text as normal._';

    await sock.sendMessage(chatId, {
        text: arg === 'on' ? getLang(sock).buttonmode_turned_on : getLang(sock).buttonmode_turned_off
    });
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['buttonmode'],
  description: 'Toggle button UI mode',
  category: 'owner',
}, async (sock, chatId, message, args) => {
  await buttonmodeCommand(sock, chatId, message, args);
});