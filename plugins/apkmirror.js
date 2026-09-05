'use strict';

const { bot } = require('../lib/pluginLoader');
const { searchApkMirror, resolveDownloadUrl } = require('../lib/apkmirror');

const USAGE = [
    '*APKMirror*',
    '',
    'Search: *.apkmirror <app name>*',
    'Resolve a result: *.apkmirror resolve <APKMirror URL>*',
    '',
    'Example: *.apkmirror WhatsApp*',
].join('\n');

function resultText(query, results) {
    const visible = results.slice(0, 8);
    const lines = visible.map((item, index) => `${index + 1}. *${item.title}*\n${item.url}`);
    return `🔎 *APKMirror results for:* ${query}\n\n${lines.join('\n\n')}\n\nShowing ${visible.length} of ${results.length} result(s).`;
}

bot({
    command: ['apkmirror', 'apksearch'],
    description: 'Search APKMirror for APK releases',
    category: 'download',
}, async (sock, chatId, message, args, query) => {
    const input = String(query || '').trim();
    if (!input) {
        await sock.sendMessage(chatId, { text: USAGE, quoted: message });
        return;
    }

    try {
        await sock.sendPresenceUpdate?.('composing', chatId);

        if (/^resolve\s+/i.test(input)) {
            const url = input.replace(/^resolve\s+/i, '').trim();
            const resolved = await resolveDownloadUrl(url);
            await sock.sendMessage(chatId, {
                text: `✅ *APKMirror download link:*\n${resolved}`,
                quoted: message,
            });
            return;
        }

        const results = await searchApkMirror(input, { apkFilesOnly: true });
        if (!results.length) {
            await sock.sendMessage(chatId, {
                text: `❌ No APKMirror results found for *${input}*.`,
                quoted: message,
            });
            return;
        }

        await sock.sendMessage(chatId, {
            text: resultText(input, results),
            quoted: message,
        });
    } catch (error) {
        console.error('[apkmirror] command failed:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ APKMirror failed: ${error.message}`,
            quoted: message,
        });
    }
});
