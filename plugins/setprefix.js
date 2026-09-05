const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

bot({
  command: ['setprefix'],
  description: 'Change the bot command prefix',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Owner only!' }); return; }
  const newPfx = args[0];
  if (!newPfx) { await sock.sendMessage(chatId, { text: 'Current prefix: *' + ctx.effectivePrefix + '*\nUsage: ' + ctx.effectivePrefix + 'setprefix <new>' }); return; }
  try {
    const { loadConfig, saveConfig } = require('../lib/config');
    const cfg = loadConfig(ctx.sessionNumber);
    cfg.PREFIX = newPfx;
    saveConfig(cfg, ctx.sessionNumber);
    await sock.sendMessage(chatId, { text: '✅ Prefix changed to: *' + newPfx + '*' });
  } catch (err) { await sock.sendMessage(chatId, { text: '❌ Failed: ' + err.message }); }
});
