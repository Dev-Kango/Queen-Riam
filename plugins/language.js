// Migrated from commands/language.js
const { hasOwnerPrivileges } = require('./sudo');

const { loadConfig, saveConfig } = require('../lib/config');
const { invalidateCache, SUPPORTED, LANG_NAMES, getLang } = require('../lib/lang');

async function languageCommand(sock, chatId, message, args, sessionNumber) {
  const isOwner = hasOwnerPrivileges((message.key.participantAlt || message.key.participant || message.key.remoteJidAlt || message.key.remoteJid), message, sock.user?.id, sessionNumber);
  const t = getLang(sessionNumber);

  if (!isOwner) {
    await sock.sendMessage(chatId, {
      text: t.language_owner_only,
    });
    return;
  }

  if (chatId.endsWith('@g.us')) {
    await sock.sendMessage(chatId, {
      text: t.language_dm_only,
    });
    return;
  }

  const cfg = loadConfig(sessionNumber);
  const current = cfg.LANGUAGE || 'en';

  if (!args || args.length === 0) {
    const currentName = LANG_NAMES[current] || current.toUpperCase();
    const text = t.language_usage.replace('{current}', `*${currentName}* (${current})`);
    await sock.sendMessage(chatId, { text });
    return;
  }

  const requested = args[0].toLowerCase().trim();

  if (!SUPPORTED.includes(requested)) {
    await sock.sendMessage(chatId, {
      text: t.language_invalid,
    });
    return;
  }

  if (requested === current) {
    await sock.sendMessage(chatId, {
      text: t.language_already_set
        .replace('{langname}', LANG_NAMES[requested] || requested)
        .replace('{lang}', requested),
    });
    return;
  }

  cfg.LANGUAGE = requested;
  saveConfig(cfg, sessionNumber);
  invalidateCache(sessionNumber);

  const tNew = getLang(sessionNumber);
  await sock.sendMessage(chatId, {
    text: tNew.language_changed
      .replace('{lang}', requested)
      .replace('{langname}', LANG_NAMES[requested] || requested),
  });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['language'],
  description: 'Change bot language',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  await languageCommand(sock, chatId, message, args, ctx.sessionNumber);
});