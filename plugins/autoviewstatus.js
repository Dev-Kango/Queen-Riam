// Migrated from commands/autostatus.js
const { hasOwnerPrivileges } = require('./sudo');

const fs = require('fs');
const path = require('path');

const { getLang } = require('../lib/lang');

// Session-aware config path
function _asConfigPath(sock) {
    const sid = sock && sock._sessionNumber ? sock._sessionNumber : null;
    return sid ? require('path').join(__dirname, '../data/autoStatus_' + sid + '.json') : require('path').join(__dirname, '../data/autoStatus.json');
}

// Load config safely
function loadConfig(sock) {
    const cp = _asConfigPath(sock);
    if (!fs.existsSync(cp)) fs.writeFileSync(cp, JSON.stringify({ enabled: false }, null, 2));
    try { return JSON.parse(fs.readFileSync(cp)); } catch { return { enabled: false }; }
}

// Save config safely
function saveConfig(config, sock) {
    fs.writeFileSync(_asConfigPath(sock), JSON.stringify(config, null, 2));
}

// Global semaphore: only 1 status read at a time, min 4s between reads
let _statusReadBusy = false;
let _lastStatusRead = 0;
const STATUS_READ_INTERVAL = 4000;

// Retry with exponential backoff
async function safeReadMessages(sock, keys, retries = 3, delay = 3000, statusJidList = null) {
    let waited = 0;
    while (_statusReadBusy || (Date.now() - _lastStatusRead < STATUS_READ_INTERVAL)) {
        await new Promise(r => setTimeout(r, 500));
        waited += 500;
        if (waited > 30000) return false;
    }
    _statusReadBusy = true;
    try {
        for (let i = 0; i < retries; i++) {
            try {
                const opts = statusJidList ? { statusJidList } : {};
                await sock.readMessages(keys, opts);
                _lastStatusRead = Date.now();
                return true;
            } catch (err) {
                if (err.message && err.message.includes('rate-overlimit') && i < retries - 1) {
                    console.log('[autoview] Rate limit, retrying in ' + delay + 'ms...');
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                } else {
                    console.error('[autoview] readMessages failed:', err.message);
                    return false;
                }
            }
        }
    } finally {
        _statusReadBusy = false;
    }
    return false;
}

// Command
async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        if (!hasOwnerPrivileges((msg.key.participantAlt || msg.key.participant || msg.key.remoteJidAlt || msg.key.remoteJid), msg, sock.user?.id, sock._sessionNumber)) {
            await sock.sendMessage(chatId, { 
                text: getLang(sock).autostatus_owner_only
            });
            return;
        }

        let config = loadConfig(sock);

        // Show usage if no arguments
        if (!args || args.length === 0) {
            const status = config.enabled ? '✅ enabled' : '❌ disabled';
            const text = getLang(sock).autostatus_status.replace('{status}', status);
            const { isButtonModeOn, sendButtonMessage } = require('../lib/buttonHelper');
            if (isButtonModeOn()) {
                await sendButtonMessage(sock, chatId, {
                    text,
                    footer: 'Queen Riam 👑',
                    buttons: [
                        { id: '.autoviewstatus on',  text: getLang(sock).btn_turn_on  },
                        { id: '.autoviewstatus off', text: getLang(sock).btn_turn_off },
                    ],
                }, msg);
            } else {
                await sock.sendMessage(chatId, {
                    text
                });
            }
            return;
        }

        // Handle commands
        const command = args[0].toLowerCase();
        if (command === 'on') {
            config.enabled = true;
            saveConfig(config, sock);
            await sock.sendMessage(chatId, { 
                text: getLang(sock).autostatus_enabled
            });
        } else if (command === 'off') {
            config.enabled = false;
            saveConfig(config, sock);
            await sock.sendMessage(chatId, { 
                text: getLang(sock).autostatus_disabled
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: getLang(sock).autostatus_invalid
            });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).autostatus_error
        });
    }
}

// Check config — sock required so each session checks its own setting
function isAutoStatusEnabled(sock) {
    return loadConfig(sock).enabled;
}

// View status helper
async function viewStatus(sock, key) {
    if (key?.remoteJid === 'status@broadcast') {
        const participant = key.participant || key.remoteJid;
        const botJid = sock.user?.id
            ? (typeof sock.decodeJid === 'function' ? sock.decodeJid(sock.user.id) : sock.user.id)
            : null;
        const jidList = botJid ? [participant, botJid] : [participant];
        await safeReadMessages(sock, [key], 3, 3000, jidList);
        console.log('✅ Viewed status from: ' + participant.split('@')[0]);
    }
}

// Handle updates
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled(sock)) return;

        // Add delay to avoid rate-limit
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (status.messages?.length > 0) {
            await viewStatus(sock, status.messages[0].key);
        } else if (status.key) {
            await viewStatus(sock, status.key);
        } else if (status.reaction?.key) {
            await viewStatus(sock, status.reaction.key);
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}





// ── Event handler self-registration ───────────────────────────────────────────
if (typeof global.bot === 'function') {
    global.bot({ on: 'status' }, async ({ sock, status }) => {
        await handleStatusUpdate(sock, status);
    });
}

module.exports = { handleStatusUpdate };

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['autoviewstatus'],
  description: 'Toggle auto-view statuses',
  category: 'owner',
}, async (sock, chatId, message, args) => {
  await autoStatusCommand(sock, chatId, message, args);
});