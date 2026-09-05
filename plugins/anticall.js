const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');


bot({
  command: ['anticall'],
  description: 'Configure anti-call mode',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Owner only.' }); return; }
  const { isButtonModeOn, sendButtonMessage } = require('../lib/buttonHelper');
  const { loadConfig, saveConfig }            = require('../lib/config');
  const mode = args[0]?.toLowerCase();
  if (!mode || !['off','decline','block'].includes(mode)) {
    if (isButtonModeOn()) {
      await sendButtonMessage(sock, chatId, {
        text: '📞 *Anti-Call*\n\nSelect a mode:',
        footer: 'Queen Riam 👑',
        buttons: [
          { id: '.anticall off',     text: '❌ Off'     },
          { id: '.anticall decline', text: '📵 Decline' },
          { id: '.anticall block',   text: '🚫 Block'   },
        ],
      }, message);
    } else { await sock.sendMessage(chatId, { text: '📌 Usage: .anticall off | decline | block' }); }
    return;
  }
  const cfg = loadConfig(ctx.sessionNumber);
  cfg.ANTICALL = mode;
  saveConfig(cfg, ctx.sessionNumber);
  await sock.sendMessage(chatId, { text: '✅ Anticall set to *' + mode.toUpperCase() + '*' });
});
