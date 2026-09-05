const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');
const { loadConfig, saveConfig } = require('../lib/config');

bot({
  command: ['alwaysonline'],
  description: 'Keep the bot visibly online or turn it off',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '❌ This command is only for the owner and sudo users!' });
    return;
  }

  const action = (args[0] || '').toLowerCase();
  const cfg = loadConfig(ctx.sessionNumber);
  const enabled = cfg.ALWAYSONLINE === 'true';

  if (!action) {
    await sock.sendMessage(chatId, {
      text: 'Always online is currently *' + (enabled ? 'ON' : 'OFF') + '*.\n\nUsage: ' + ctx.effectivePrefix + 'alwaysonline on|off',
    });
    return;
  }

  if (action !== 'on' && action !== 'off') {
    await sock.sendMessage(chatId, {
      text: 'Usage: ' + ctx.effectivePrefix + 'alwaysonline on|off',
    });
    return;
  }

  const shouldStayOnline = action === 'on';
  cfg.ALWAYSONLINE = shouldStayOnline ? 'true' : 'false';
  saveConfig(cfg, ctx.sessionNumber);

  try {
    await sock.sendPresenceUpdate(shouldStayOnline ? 'available' : 'unavailable');
  } catch (_) {}

  await sock.sendMessage(chatId, {
    text: '✅ Always online is now *' + action.toUpperCase() + '*.',
  });
});
