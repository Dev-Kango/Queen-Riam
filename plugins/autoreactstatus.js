const { bot } = require('../lib/pluginLoader');

bot({
  command: ['autoreactstatus', 'autostatusreply'],
  description: 'Toggle auto-react/reply to statuses',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!message.key.fromMe) { await sock.sendMessage(chatId, { text: '❌ Owner only!' }); return; }
  const { isButtonModeOn, sendButtonMessage } = require('../lib/buttonHelper');
  const { loadConfig, saveConfig }            = require('../lib/config');
  const { getLang }                           = require('../lib/lang');
  const onOff = args[0]?.toLowerCase();
  const c     = ctx.c;
  if (!onOff || !['on','off'].includes(onOff)) {
    if (isButtonModeOn()) {
      await sendButtonMessage(sock, chatId, {
        text: '⚙️ *' + c + '*\n\n' + getLang(sock).btn_select_option,
        footer: 'Queen Riam 👑',
        buttons: [
          { id: ctx.effectivePrefix + c + ' on',  text: getLang(sock).btn_turn_on  },
          { id: ctx.effectivePrefix + c + ' off', text: getLang(sock).btn_turn_off },
        ],
      }, message);
    } else {
      await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + c + ' on|off' });
    }
    return;
  }
  const key = c === 'autoreactstatus' ? 'AUTO_STATUS_REACT' : 'AUTO_STATUS_REPLY';
  const cfg = loadConfig(ctx.sessionNumber);
  cfg[key]  = onOff === 'on' ? 'true' : 'false';
  saveConfig(cfg, ctx.sessionNumber);
  await sock.sendMessage(chatId, { text: '✅ ' + c + ' is now *' + (onOff === 'on' ? 'TRUE' : 'FALSE') + '*' });
});
