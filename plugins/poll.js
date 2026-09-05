// Migrated from commands/poll.js

const { getLang } = require('../lib/lang');
async function pollCommand(sock, chatId, message, rawQuery, prefix) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).poll_groups_only
        });
        return;
    }

    // Format: .poll Question? | Option 1 | Option 2 | Option 3
    const parts = rawQuery.split('|').map(p => p.trim()).filter(Boolean);

    if (parts.length < 3) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).poll_usage.replace(/\{prefix\}/g, prefix)
        });
        return;
    }

    const question = parts[0];
    const options  = parts.slice(1);

    if (options.length > 12) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).poll_max_options
        });
        return;
    }

    await sock.sendMessage(chatId, {
        poll: {
            name: question,
            values: options,
            selectableCount: 1
        }
    });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['poll'],
  description: 'Create a group poll',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  await pollCommand(sock, chatId, message, query, ctx.effectivePrefix);
});