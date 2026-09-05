'use strict';

const SEND_DELAY   = 800;   // ms between sends (prevents rate-limit)
const MAX_RETRIES  = 3;
const RETRY_BASE   = 3000;  // ms — multiplied by attempt number

class SessionQueue {
    constructor(sessionId) {
        this.sessionId  = sessionId;
        this.queue      = [];
        this.processing = false;
        this.stats      = { sent: 0, failed: 0, retried: 0 };
    }

    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject, retries: 0 });
            if (!this.processing) this._drain();
        });
    }

    async _drain() {
        if (this.processing) return;
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const item = this.queue.shift();
                try {
                    const result = await item.task();
                    this.stats.sent++;
                    item.resolve(result);
                } catch (err) {
                    if (item.retries < MAX_RETRIES) {
                        item.retries++;
                        this.stats.retried++;
                        // put back at front for immediate retry after delay
                        this.queue.unshift(item);
                        await _sleep(RETRY_BASE * item.retries);
                        continue;
                    }
                    this.stats.failed++;
                    item.reject(err);
                }
                if (this.queue.length > 0) await _sleep(SEND_DELAY);
            }
        } finally {
            // Always reset so queue never gets permanently stuck
            this.processing = false;
            // If items were added while we were in the finally block, drain again
            if (this.queue.length > 0) this._drain();
        }
    }

    stats_snapshot() {
        return { ...this.stats, pending: this.queue.length, session: this.sessionId };
    }
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// registry: sessionId → SessionQueue
const _queues = new Map();

function _getQueue(sessionId) {
    const key = String(sessionId || 'main');
    if (!_queues.has(key)) _queues.set(key, new SessionQueue(key));
    return _queues.get(key);
}

/**
 * Monkey-patch sock.sendMessage so every call goes through the queue.
 * Call once right after makeWASocket().
 */
function patchSocket(sock, sessionId) {
    const id  = sessionId || sock._sessionNumber || 'main';
    const q   = _getQueue(id);
    const orig = sock.sendMessage.bind(sock);

    sock.sendMessage = (jid, content, opts) =>
        q.enqueue(() => orig(jid, content, opts));

    sock._queueId = id;
    return sock;
}

/** Get stats for all sessions or a specific one. */
function getStats(sessionId) {
    if (sessionId) return _queues.get(String(sessionId))?.stats_snapshot() || null;
    return Array.from(_queues.values()).map(q => q.stats_snapshot());
}

module.exports = { patchSocket, getStats };
