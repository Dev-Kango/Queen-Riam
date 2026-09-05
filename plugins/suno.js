// suno.js — AI music generation via aisong.io (free Suno frontend)
// Uses temp-mail OTP login → generate → poll → send MP3 + cover as WhatsApp audio

const { bot } = require('../lib/pluginLoader');

// ── Cookie jar ────────────────────────────────────────────────────────────────

function makeCookieJar() {
    const jar = new Map();
    return {
        header:  () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
        store(setCookieHeaders = []) {
            for (const line of setCookieHeaders) {
                const part = line.split(';')[0].trim();
                const eq   = part.indexOf('=');
                if (eq < 1) continue;
                jar.set(part.slice(0, eq), part.slice(eq + 1));
            }
        },
        has: (k) => jar.has(k),
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEMP_MAIL_BASE = 'https://api.internal.temp-mail.io/api/v3';
const AISONG_BASE    = 'https://aisong.io';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Fetch wrapper that carries the cookie jar automatically
function makeGot(jar) {
    return async function got(method, url, { body, form, headers: extra = {}, noRedirect = false } = {}) {
        const isForm = !!form;
        const opts = {
            method,
            redirect: noRedirect ? 'manual' : 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/138 Safari/537.36',
                'Referer':    AISONG_BASE + '/',
                Cookie:       jar.header(),
                ...(isForm ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
                ...(body    ? { 'Content-Type': 'application/json'                 } : {}),
                ...extra,
            },
            ...(form ? { body: new URLSearchParams(form).toString() } : {}),
            ...(body ? { body: JSON.stringify(body)                 } : {}),
        };
        const res = await fetch(url, opts);
        const rawCookies = res.headers.getSetCookie?.() ?? [];
        const setCookies = rawCookies.length
            ? rawCookies
            : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
        jar.store(setCookies);
        return res;
    };
}

// ── Temp-mail ─────────────────────────────────────────────────────────────────

async function createTempEmail() {
    const res = await fetch(`${TEMP_MAIL_BASE}/email/new`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ min_name_length: 10, max_name_length: 10 }),
    });
    if (!res.ok) throw new Error(`temp-mail create failed: ${res.status}`);
    return (await res.json()).email;
}

async function pollForOtp(email, timeoutMs = 60_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await sleep(3000);
        try {
            const res  = await fetch(`${TEMP_MAIL_BASE}/email/${email}/messages`);
            const msgs = await res.json();
            for (const m of (Array.isArray(msgs) ? msgs : [])) {
                const hit = `${m.subject ?? ''} ${m.body_text ?? ''}`.match(/\b(\d{6})\b/);
                if (hit) return hit[1];
            }
        } catch { /* retry */ }
    }
    return null;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function login(got, jar, attemptLimit = 3) {
    for (let attempt = 1; attempt <= attemptLimit; attempt++) {
        const email = await createTempEmail();

        const csrfRes = await got('GET', `${AISONG_BASE}/api/auth/csrf`);
        const csrfData = await csrfRes.json();
        if (!csrfData.csrfToken) throw new Error('No csrfToken');
        const csrf = csrfData.csrfToken;

        try {
            const r = await got('POST', `${AISONG_BASE}/api/auth/send-verification-code`, {
                body: { email },
            });
            if (!r.ok) continue;
        } catch {
            continue;
        }

        const otp = await pollForOtp(email, 60_000);
        if (!otp) continue;

        const verifyRes = await got('POST', `${AISONG_BASE}/api/auth/callback/verification-code`, {
            form: {
                csrfToken:   csrf,
                email,
                code:        otp,
                redirect:    'false',
                callbackUrl: AISONG_BASE,
                json:        'true',
            },
            noRedirect: true,
        });

        const location = verifyRes.headers.get('location') ?? '';
        if (verifyRes.status === 302 && !location.includes('/api/auth/signin') && !location.includes('error')) {
            const dest = location.startsWith('http') ? location : `${AISONG_BASE}${location}`;
            await got('GET', dest);
        } else if (!jar.has('__Secure-next-auth.session-token') && !jar.has('next-auth.session-token')) {
            continue;
        }

        const sessionRes  = await got('GET', `${AISONG_BASE}/api/auth/session`);
        const sessionData = await sessionRes.json();
        if (sessionData?.user) return;
    }
    throw new Error('Login to aisong.io failed after all attempts');
}

// ── Generation ────────────────────────────────────────────────────────────────

async function generate(got, prompt, title) {
    const res = await got('POST', `${AISONG_BASE}/api/v2/generate`, {
        body: {
            inputType:        '10',   // description mode
            prompt,
            title,
            tags:             'Pop, Upbeat, Energetic',
            makeInstrumental: false,
            mvVersion:        'chirp-v5.0',
        },
    });
    const data = await res.json();
    const taskBatchId = data?.data?.taskBatchId;
    if (!taskBatchId) throw new Error(`No taskBatchId — response: ${JSON.stringify(data).slice(0, 200)}`);
    return taskBatchId;
}

async function pollTaskState(got, taskBatchId, timeoutMs = 5 * 60_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await sleep(5000);
        const res  = await got('GET', `${AISONG_BASE}/api/v2/task-state?taskBatchId=${taskBatchId}`);
        const data = await res.json();
        const { taskStatus, items = [] } = data?.data ?? {};

        if (taskStatus === 'failed') throw new Error('aisong.io: generation failed on server');

        if (taskStatus === 'finished') {
            const cdnReady = items.filter(i => i.audioUrl && !i.audioUrl.includes('audiopipe'));
            if (cdnReady.length > 0) return cdnReady;
            const anyAudio = items.filter(i => i.audioUrl);
            if (anyAudio.length > 0) return anyAudio;
        }
    }
    throw new Error('Timed out — no songs returned after 5 minutes');
}

// ── Download to buffer ────────────────────────────────────────────────────────

async function fetchBuffer(url, extraHeaders = {}) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/138 Safari/537.36',
            'Referer':    `${AISONG_BASE}/`,
            ...extraHeaders,
        },
    });
    if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

// ── Plugin ────────────────────────────────────────────────────────────────────

bot({
    command:     ['suno', 'aisong'],
    description: 'Generate AI music — just describe the song you want',
    category:    'ai',
}, async (sock, chatId, message, args, query, ctx) => {
    if (!query) {
        await sock.sendMessage(chatId, {
            text: `🎵 *AI Music Generator*\n\nUsage: ${ctx.effectivePrefix}suno <describe your song>\n\nExample:\n${ctx.effectivePrefix}suno an upbeat afrobeat song about making money and living life`
        });
        return;
    }

    // Processing message
    await sock.sendMessage(chatId, {
        react: { text: '🎼', key: message.key }
    });

    const processingMsg = await sock.sendMessage(chatId, {
        text:
            `🎼 *AI Music Studio*\n` +
            `━━━━━━━━━━━━━━━━\n\n` +
            `🎤 *Prompt:* ${query}\n\n` +
            `⚡ *Status:* Signing in to music engine...\n` +
            `⏱️ *ETA:* 2–4 minutes (AI music takes time!)\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ǫᴜᴇᴇɴ ʀɪᴀᴍ`
    });

    const jar = makeCookieJar();
    const got = makeGot(jar);

    try {
        // Step 1: Login
        await login(got, jar);

        // Update status
        await sock.sendMessage(chatId, {
            text:
                `🎼 *AI Music Studio*\n` +
                `━━━━━━━━━━━━━━━━\n\n` +
                `🎤 *Prompt:* ${query}\n\n` +
                `🎹 *Status:* Composing your track...\n` +
                `⏱️ _This takes 1–2 minutes, hang tight_`
        }, { quoted: message });

        // Step 2: Generate
        const title       = query.slice(0, 50);
        const taskBatchId = await generate(got, query, title);

        // Step 3: Poll
        const songs = await pollTaskState(got, taskBatchId);
        if (!songs.length) throw new Error('No songs returned');

        // Step 4: Download + send first song only
        const song = songs[0];

        const audioHeaders = {};
        if (song.audioUrl.includes('audiopipe')) audioHeaders.Cookie = jar.header();

        const audioBuffer = await fetchBuffer(song.audioUrl, audioHeaders);
        const trackTitle  = song.title || query.slice(0, 40);

        await sock.sendMessage(chatId, {
            audio:    audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${trackTitle}.mp3`,
            ptt:      false,
        });

        await sock.sendMessage(chatId, {
            text: `🎵 *${trackTitle}*\n_Prompt: ${query}_\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ǫᴜᴇᴇɴ ʀɪᴀᴍ`,
        });

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (err) {
        console.error('[suno] Error:', err.message);
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
        await sock.sendMessage(chatId, {
            text: `❌ *Suno failed*\n\n${err.message}\n\nPlease try again in a moment.`
        });
    }
});
