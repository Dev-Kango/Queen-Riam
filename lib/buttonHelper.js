const { loadConfig } = require('./config');
const { sendButtons } = require('kango-wa');

function isButtonModeOn() {
    try {
        const cfg = loadConfig();
        return cfg.BUTTONMODE === 'on';
    } catch (_) {
        return false;
    }
}

/**
 * Send a message. When button mode is ON, attaches interactive quick-reply
 * buttons (kango-wa nativeFlowMessage). When OFF, sends plain text.
 *
 * @param {object} sock
 * @param {string} jid
 * @param {object} opts  - { text, footer, buttons: [{ id, text }] }
 * @param {object} quoted - original message to quote (optional)
 */
async function sendButtonMessage(sock, jid, opts, quoted) {
    const { text, footer, buttons } = opts;

    const hasQuickReply = (buttons || []).some(b => b.id);

    if (!isButtonModeOn() || !hasQuickReply) {
        return quoted
            ? sock.sendMessage(jid, { text }, { quoted })
            : sock.sendMessage(jid, { text });
    }

    return sendButtons(sock, jid, { text, footer, buttons });
}

module.exports = { isButtonModeOn, sendButtonMessage };
