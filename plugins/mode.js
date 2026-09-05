const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');

const fs = require('fs');

bot({
  command: ['mode'],
  description: 'Set bot to public or private mode',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: 'Owner only!' }); return; }
  const mcPath = ctx.sessionNumber ? './data/messageCount_' + ctx.sessionNumber + '.json' : './data/messageCount.json';
  let data;
  try { data = JSON.parse(fs.readFileSync(mcPath)); }
  catch { await sock.sendMessage(chatId, { text: 'Failed to read bot mode.' }); return; }
  const action = args[0]?.toLowerCase();
  if (!action) { await sock.sendMessage(chatId, { text: 'Mode: *' + (data.isPublic ? 'public' : 'private') + '*\nUsage: ' + ctx.effectivePrefix + 'mode public|private' }); return; }
  if (!['public','private'].includes(action)) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'mode public|private' }); return; }
  data.isPublic = action === 'public';
  fs.writeFileSync(mcPath, JSON.stringify(data, null, 2));
  await sock.sendMessage(chatId, { text: 'Bot is now in *' + action + '* mode' });
});
