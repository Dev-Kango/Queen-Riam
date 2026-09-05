// Font / text-style converter plugin for Queen Riam
// ALL styles use BMP Unicode — renders correctly in WhatsApp on Android & iOS.
//
// Usage:
//   .font              → list all styles with previews
//   .font <style>      → preview that one style
//   .font <style> <text> → convert text
//   .fonts             → alias for listing

const { bot } = require('../lib/pluginLoader');

// ─── Helper ───────────────────────────────────────────────────────────────────
// Uses [...str] so multi-byte Unicode chars (emoji, etc.) are handled correctly
function buildMap(...pairs) {
    const map = {};
    for (const [src, dst] of pairs) {
        const s = [...src];
        const d = [...dst];
        for (let i = 0; i < s.length; i++) {
            if (d[i] !== undefined) map[s[i]] = d[i];
        }
    }
    return map;
}

const lower  = 'abcdefghijklmnopqrstuvwxyz';
const upper  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const digits = '0123456789';

// ─── Font Maps (BMP only) ────────────────────────────────────────────────────
const FONTS = {

    // Full-width / Aesthetic
    wide: buildMap(
        [lower,  'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'],
        [upper,  'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ'],
        [digits, '０１２３４５６７８９']
    ),

    // Small Capitals (modifier letters — BMP)
    smallCaps: buildMap(
        [lower, 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ']
    ),

    // Superscript
    superscript: buildMap(
        [lower,  'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻ'],
        [upper,  'ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵠᴿˢᵀᵁᵛᵂˣʸᶻ'],
        [digits, '⁰¹²³⁴⁵⁶⁷⁸⁹']
    ),

    // Subscript
    subscript: buildMap(
        [lower,  'ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz'],
        [digits, '₀₁₂₃₄₅₆₇₈₉']
    ),

    // Circled letters (BMP, U+24B6–U+24E9)
    circled: buildMap(
        [lower,  'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'],
        [upper,  'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ'],
        [digits, '⓪①②③④⑤⑥⑦⑧⑨']
    ),

    // Upside-down / Flip
    upsideDown: (() => {
        const src = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?'];
        const dst = [...'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎzɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz0ІᘔƐᔭϛ9ㄥ86˙،¡¿'];
        const map = {};
        src.forEach((c, i) => { if (dst[i]) map[c] = dst[i]; });
        return map;
    })(),

    // Wavy / cursive (IPA + special Latin — BMP)
    wavy: buildMap(
        [lower, 'αвcɗeƒɠɧıʝкlɱɳσρqrƨƭυvωxɣʑ'],
        [upper, 'ΑВCƊЄƑƓΉΙJΚLΜΝΘΡQRƧƬUVΩXΨΖ']
    ),

    // Greek lookalikes
    greek: buildMap(
        [lower, 'αbγδεfgηιjκλμνοπqρσtuυvωxγζ'],
        [upper, 'ΑΒΓΔΕΦΓΗΙΙΚΛΜΝΟΠΘΡΣΤυΥVΩΧΨΖ']
    ),

    // Leet speak
    leet: buildMap(
        [lower, '4bcd3fgh1jk1mn0pqr55+uvwxy2'],
        [upper, '4BCD3FGH1JK1MN0PQR55+UVWXY2'],
        [digits, '0123456789']
    ),

    // Strikethrough (combining char U+0336)
    strikethrough: (() => {
        const map = {};
        for (const c of [...lower, ...upper, ...digits]) map[c] = c + '\u0336';
        return map;
    })(),

    // Underline (combining char U+0332)
    underline: (() => {
        const map = {};
        for (const c of [...lower, ...upper, ...digits]) map[c] = c + '\u0332';
        return map;
    })(),

    // Double underline (U+0333)
    doubleUnderline: (() => {
        const map = {};
        for (const c of [...lower, ...upper, ...digits]) map[c] = c + '\u0333';
        return map;
    })(),

    // Overline (U+0305)
    overline: (() => {
        const map = {};
        for (const c of [...lower, ...upper, ...digits]) map[c] = c + '\u0305';
        return map;
    })(),

    // Glitch / Zalgo (randomised combining chars)
    glitch: null, // rebuilt on every call — see convertText()
};

// Aliases
FONTS.fullwidth = FONTS.wide;
FONTS.aesthetic = FONTS.wide;
FONTS.vapor     = FONTS.wide;
FONTS.smcaps    = FONTS.smallCaps;
FONTS.flip      = FONTS.upsideDown;
FONTS.cursive   = FONTS.wavy;

// ─── Converter ────────────────────────────────────────────────────────────────

function buildGlitchMap() {
    const tops    = ['\u0300','\u0301','\u0302','\u0303','\u0308','\u030A','\u030B','\u030C'];
    const middles = ['\u0334','\u0335','\u0336'];
    const bottoms = ['\u0316','\u0317','\u031C','\u0332','\u0333'];
    const map = {};
    for (const c of (lower + upper)) {
        map[c] = c
            + tops[Math.floor(Math.random() * tops.length)]
            + tops[Math.floor(Math.random() * tops.length)]
            + middles[Math.floor(Math.random() * middles.length)]
            + bottoms[Math.floor(Math.random() * bottoms.length)];
    }
    return map;
}

function convertText(text, fontMap) {
    return [...text].map(ch => {
        const m = fontMap[ch];
        return m !== undefined ? m : ch;
    }).join('');
}

// ─── Style list ───────────────────────────────────────────────────────────────

const STYLE_NAMES = [
    'wide', 'smallCaps', 'superscript', 'subscript',
    'circled', 'upsideDown', 'wavy', 'greek', 'leet',
    'strikethrough', 'underline', 'doubleUnderline', 'overline', 'glitch',
];

function buildStyleList() {
    const lines = STYLE_NAMES.map(name => {
        const map     = name === 'glitch' ? buildGlitchMap() : FONTS[name];
        const preview = convertText('Hello World', map);
        return `│ • *${name}* — ${preview}`;
    });

    return [
        '╭─ 🔤 *Font Styles*',
        '│',
        ...lines,
        '│',
        '│ *Aliases:* fullwidth, aesthetic, vapor, smcaps, flip, cursive',
        '│',
        '╰─ Usage: `.font <style> <text>`',
    ].join('\n');
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

bot(
    {
        command: ['font', 'fonts'],
        description: 'Convert text to a Unicode font/style',
        category: 'utility',
    },
    async (sock, chatId, message, args, query, ctx) => {

        // .fonts or bare .font
        if (!args.length || ctx.c === 'fonts') {
            await sock.sendMessage(chatId, { text: buildStyleList() }, { quoted: message });
            return;
        }

        const styleName = args[0].toLowerCase();
        const isGlitch  = styleName === 'glitch';
        const fontMap   = isGlitch
            ? buildGlitchMap()
            : (FONTS[styleName] ?? FONTS[Object.keys(FONTS).find(k => k.toLowerCase() === styleName)]);

        if (!fontMap) {
            await sock.sendMessage(
                chatId,
                { text: `❌ Unknown style *"${args[0]}"*\n\nAvailable: ${STYLE_NAMES.join(', ')}\n\nSend *.fonts* to preview all.` },
                { quoted: message }
            );
            return;
        }

        // Bare style name → preview only
        if (args.length === 1) {
            const map     = isGlitch ? buildGlitchMap() : fontMap;
            const preview = convertText('Hello World', map);
            await sock.sendMessage(
                chatId,
                { text: `*${args[0]}* preview:\n\n${preview}\n\nUsage: \`.font ${args[0]} <your text>\`` },
                { quoted: message }
            );
            return;
        }

        const text      = args.slice(1).join(' ');
        const map       = isGlitch ? buildGlitchMap() : fontMap;
        const converted = convertText(text, map);
        await sock.sendMessage(chatId, { text: converted }, { quoted: message });
    }
);
