const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

bot({
  command: ['autoread'],
  description: 'Toggle auto-read messages',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Owner only!' }); return; }
  const { isButtonModeOn, sendButtonMessage } = require('../lib/buttonHelper');
  const { loadConfig, saveConfig }            = require('../lib/config');
  const { getLang }                           = require('../lib/lang');
  const onOff = args[0]?.toLowerCase();
  if (!onOff) {
    if (isButtonModeOn()) {
      await sendButtonMessage(sock, chatId, {
        text: '⚙️ *Auto Read*\n\n' + getLang(sock).btn_select_option,
        footer: 'Queen Riam 👑',
        buttons: [
          { id: '.autoread on',  text: getLang(sock).btn_turn_on  },
          { id: '.autoread off', text: getLang(sock).btn_turn_off },
        ],
      }, message);
    } else { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'autoread on|off' }); }
    return;
  }
  const cfg = loadConfig(ctx.sessionNumber);
  cfg.AUTOREAD = onOff === 'on' ? 'true' : 'false';
  saveConfig(cfg, ctx.sessionNumber);
  await sock.sendMessage(chatId, { text: '✅ Autoread is now *' + (onOff === 'on' ? 'TRUE' : 'FALSE') + '*' });
});
