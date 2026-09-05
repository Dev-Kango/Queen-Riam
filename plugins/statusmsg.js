const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

bot({
  command: ['statusmsg'],
  description: 'Set auto-status reply message',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Owner only!' }); return; }
  if (!query) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'statusmsg <message>' }); return; }
  const { loadConfig, saveConfig } = require('../lib/config');
  const cfg = loadConfig(ctx.sessionNumber);
  cfg.AUTO_STATUS_MSG = query;
  saveConfig(cfg, ctx.sessionNumber);
  await sock.sendMessage(chatId, { text: '✅ Status message set to: ' + query });
});
