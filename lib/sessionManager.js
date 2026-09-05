const path = require('path');
const { patchSocket } = require('./messageQueue');
const fs = require('fs');
const pino = require('pino');
const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    delay,
} = require('@whiskeysockets/baileys');
const { getAuthState } = require('./authState');

// Lazy-load to avoid circular dependency at startup
let _handleMessages = null;
function getHandleMessages() {
    if (!_handleMessages) _handleMessages = require('../main').handleMessages;
    return _handleMessages;
}


// active sessions map: cleanNumber → { sock, connected, reconnecting }
const activeSessions = {};

// Per-session in-memory message store, used to answer Baileys' getMessage()
// callback so WhatsApp can properly resend messages that a linked device
// (e.g. the paired user's phone) failed to decrypt. Without this, retry
// requests silently fail and replies never show up on the other device.
const messageStores = {}; // cleanNumber → Map<`${jid}:${id}`, messageContent>
const MAX_STORE_PER_SESSION = 200;

function getMessageStore(cleanNumber) {
    if (!messageStores[cleanNumber]) messageStores[cleanNumber] = new Map();
    return messageStores[cleanNumber];
}

function storeMessage(cleanNumber, jid, id, message) {
    if (!jid || !id || !message) return;
    const store = getMessageStore(cleanNumber);
    store.set(`${jid}:${id}`, message);
    if (store.size > MAX_STORE_PER_SESSION) {
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
    }
}

function retrieveMessage(cleanNumber, jid, id) {
    return messageStores[cleanNumber]?.get(`${jid}:${id}`);
}


// Wrap sendMessage so outgoing content is cached immediately, before any
// upsert reflection arrives — closes the race window right after sending.
function attachSendCache(sock, cleanNumber) {
    const orig = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, opts) => {
        const result = await orig(jid, content, opts);
        if (result?.key?.id && result?.message) {
            storeMessage(cleanNumber, jid, result.key.id, result.message);
        }
        return result;
    };
}

// Core session runner — called for both rehydration and post-pairing reconnect
async function runSession(cleanNumber, sessionDir, sendWelcome) {
    // Prevent concurrent runs
    const entry = activeSessions[cleanNumber];
    if (entry && entry.reconnecting) {
        console.log(`[pair] ${cleanNumber} already reconnecting, skip`);
        return;
    }
    if (activeSessions[cleanNumber]) activeSessions[cleanNumber].reconnecting = true;

    let state, saveCreds, version;
    try {
        ({ state, saveCreds } = await getAuthState(sessionDir, cleanNumber));
        ({ version } = await fetchLatestBaileysVersion());
    } catch (err) {
        console.error(`[pair] ${cleanNumber} session init error:`, err.stack || err.message);
        if (activeSessions[cleanNumber]) activeSessions[cleanNumber].reconnecting = false;
        setTimeout(() => runSession(cleanNumber, sessionDir, false), 8000);
        return;
    }

    let sock;
    try {
        sock = createSocket(version, state, saveCreds, cleanNumber);
    } catch (err) {
        console.error(`[pair] ${cleanNumber} socket create error:`, err.stack || err.message);
        if (activeSessions[cleanNumber]) activeSessions[cleanNumber].reconnecting = false;
        setTimeout(() => runSession(cleanNumber, sessionDir, false), 8000);
        return;
    }

    sock.public = true;
    attachSendCache(sock, cleanNumber);
    patchSocket(sock, cleanNumber);
    sock.ev.on('creds.update', saveCreds);
    sock._sessionNumber = cleanNumber;
    attachMessageHandler(sock, cleanNumber);

    if (activeSessions[cleanNumber]) {
        activeSessions[cleanNumber].sock = sock;
        activeSessions[cleanNumber].reconnecting = false;
        activeSessions[cleanNumber].connected = false;
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log(`[pair] ✅ ${cleanNumber} connected`);
            if (activeSessions[cleanNumber]) {
                activeSessions[cleanNumber].connected = true;
                activeSessions[cleanNumber].sock = sock;
            }

            if (sendWelcome) {
                sendWelcome = false;
                try {
                    await delay(1000);
                    const myJid = sock.user?.id;
                    if (myJid) {
                        await sock.sendMessage(myJid, {
                            text:
                                `✅ *Queen Riam Bot Connected!*\n\n` +
                                `Your number *+${cleanNumber}* is now linked.\n` +
                                `Try *.ping* or *.menu* to test it.\n\n` +
                                `👑 _Queen Riam_`,
                        });
                        console.log(`[pair] welcome sent to ${cleanNumber}`);
                    }
                } catch (e) {
                    console.error(`[pair] welcome msg failed for ${cleanNumber}:`, e.message);
                }
            }
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = code === DisconnectReason.loggedOut || code === 401;
            if (activeSessions[cleanNumber]) activeSessions[cleanNumber].connected = false;

            if (loggedOut) {
                console.log(`[pair] ${cleanNumber} logged out — clearing session`);
                activeSessions[cleanNumber] = null;
                messageStores[cleanNumber]?.clear();
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
            } else {
                console.log(`[pair] ${cleanNumber} disconnected (code ${code}), retrying in 5s...`);
                setTimeout(() => runSession(cleanNumber, sessionDir, false), 5000);
            }
        }
    });
}

// ────────────────────────────────────────────────────────────────────
// Public API: called by pair.js
// ────────────────────────────────────────────────────────────────────

async function generatePairingCode(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (activeSessions[cleanNumber]?.pending) throw new Error('ALREADY_ACTIVE');

    const sessionDir = path.join(__dirname, `../session/${cleanNumber}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await getAuthState(sessionDir, cleanNumber);

    // Already registered — just ensure it's running
    if (state.creds.registered) {
        if (!activeSessions[cleanNumber]?.connected) {
            activeSessions[cleanNumber] = { pending: false, connected: false };
            runSession(cleanNumber, sessionDir, false);
        }
        return null;
    }

    const { version } = await fetchLatestBaileysVersion();
    let sock;
    try {
        sock = createSocket(version, state, saveCreds, cleanNumber);
    } catch (err) {
        throw new Error(`Failed to create pairing socket: ${err.message}`);
    }

    sock.ev.on('creds.update', saveCreds);
    activeSessions[cleanNumber] = { sock, pending: true, connected: false };

    // Pairing socket: once it closes hand off entirely to runSession
    let handedOff = false;
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (handedOff) return;
            const code = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = code === DisconnectReason.loggedOut || code === 401;
            if (loggedOut) {
                activeSessions[cleanNumber] = null;
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
                return;
            }
            handedOff = true;
            console.log(`[pair] Pairing socket closed (${code}) → starting persistent session`);
            activeSessions[cleanNumber] = { pending: false, connected: false };
            setTimeout(() => runSession(cleanNumber, sessionDir, true), 3000);
        }
    });

    // Mirror terminal pairing: wait 3s for WS handshake to settle, then request code.
    // Retry up to 3x with a fresh socket on each failure (same pattern as index.js).
    const MAX_ATTEMPTS = 3;
    let lastErr;
    let currentSock = sock;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (attempt > 1) {
            console.log(`[pair] Retry attempt ${attempt}/${MAX_ATTEMPTS} for ${cleanNumber}...`);
            try { currentSock.end(); } catch (_) {}
            await delay(5000);
            try {
                const freshState = await getAuthState(sessionDir, cleanNumber);
                currentSock = createSocket(version, freshState.state, freshState.saveCreds, cleanNumber);
                currentSock.ev.on('creds.update', freshState.saveCreds);
                if (activeSessions[cleanNumber]) activeSessions[cleanNumber].sock = currentSock;
            } catch (e) {
                console.error(`[pair] Fresh socket failed on attempt ${attempt}:`, e.message);
                continue;
            }
        }
        // 3-second delay mirrors the setTimeout(3000) used in terminal pairing (index.js line ~680)
        await delay(3000);
        try {
            const codePromise = currentSock.requestPairingCode(cleanNumber);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Pairing code request timed out after 30s')), 30000)
            );
            const code = await Promise.race([codePromise, timeoutPromise]);
            if (activeSessions[cleanNumber]) activeSessions[cleanNumber].pending = false;
            return code?.match(/.{1,4}/g)?.join('-') || code;
        } catch (err) {
            console.error(`[pair] requestPairingCode attempt ${attempt} failed for ${cleanNumber}:`, err.message);
            lastErr = err;
        }
    }
    try { currentSock.end(); } catch (_) {}
    activeSessions[cleanNumber] = null;
    throw lastErr;
}

function getActiveSessions() {
    return Object.keys(activeSessions).filter(k => activeSessions[k] !== null);
}

// Rehydrate existing sessions on bot startup
async function rehydrateSessions() {
    const sessionBase = path.join(__dirname, '../session');
    try {
        const entries = fs.readdirSync(sessionBase, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const cleanNumber = entry.name;
            if (!/^\d+$/.test(cleanNumber)) continue;
            const sessionDir = path.join(sessionBase, cleanNumber);
            if (!fs.existsSync(path.join(sessionDir, 'creds.json'))) continue;
            console.log(`[pair] 🔄 Rehydrating session for ${cleanNumber}`);
            activeSessions[cleanNumber] = { pending: false, connected: false };
            runSession(cleanNumber, sessionDir, true);
            await delay(2000);
        }
    } catch (err) {
        console.error('[pair] rehydrateSessions error:', err.message);
    }
}

// Additional numbered sessions are started explicitly by the pairing command.
// Do not auto-rehydrate them during the main bot startup.

module.exports = { generatePairingCode, getActiveSessions };
