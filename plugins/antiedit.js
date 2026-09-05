// Anti-Edit plugin — toggle command for the anti-edit feature in index.js
const { hasOwnerPrivileges } = require('./sudo');
// Modes: off | private (DM only) | chat (expose in group)

const { loadConfig, saveConfig } = require('../lib/config');
const { getLang } = require('../lib/lang');
const { bot } = require('../lib/pluginLoader');

function statusLabel(cfg) {
    const val = (cfg.ANTIEDIT || 'off').toLowerCase();
    if (val === 'private') return '🕵️ Active — Private (DM)';
    if (val === 'chat')    return '📣 Active — In-Chat';
    return '🔕 Disabled';
}

bot({
    command: ['antiedit'],
    description: 'Toggle anti-edit message detection',
    category: 'owner',
}, async (sock, chatId, message, args) => {

    if (!hasOwnerPrivileges((message.key.participantAlt || message.key.participant || message.key.remoteJidAlt || message.key.remoteJid), message, sock.user?.id, sock._sessionNumber)) {
        await sock.sendMessage(chatId, { text: getLang(sock).antiedit_owner_only });
        return;
    }

    const sessionNumber = sock._sessionNumber;
    const cfg = loadConfig(sessionNumber);
    const mode = (args[0] || '').toLowerCase();

    if (!mode) {
        const status = statusLabel(cfg);
        await sock.sendMessage(chatId, {
            text: getLang(sock).antiedit_status.replace('{status}', status)
        });
        return;
    }

    if (mode === 'off') {
        cfg.ANTIEDIT = 'off';
        saveConfig(cfg, sessionNumber);
        await sock.sendMessage(chatId, { text: getLang(sock).antiedit_off });
        return;
    }

    if (mode === 'private') {
        cfg.ANTIEDIT = 'private';
        saveConfig(cfg, sessionNumber);
        await sock.sendMessage(chatId, { text: getLang(sock).antiedit_on_private });
        return;
    }

    if (mode === 'chat') {
        cfg.ANTIEDIT = 'chat';
        saveConfig(cfg, sessionNumber);
        await sock.sendMessage(chatId, { text: getLang(sock).antiedit_on_chat });
        return;
    }

    // Invalid option
    await sock.sendMessage(chatId, {
        text: '❌ *Invalid option.*\n\nUsage:\n• `.antiedit private` — Alert you in DM\n• `.antiedit chat` — Expose in group\n• `.antiedit off` — Disable'
    });
});
