// Migrated from commands/screenshot.js

/**
 * .screenshot command — WhatsApp-style chat bubble screenshot
 * Uses node-canvas to render a realistic WhatsApp dark-theme message card
 */

let createCanvas, registerFont, loadImage;
try {
    const _cv = require('canvas');
    createCanvas = _cv.createCanvas;
    registerFont = _cv.registerFont;
    loadImage    = _cv.loadImage;
} catch (_) { /* canvas not available — .screenshot disabled */ }
const path = require("path");
const axios = require("axios");
const { getLang } = require("../lib/lang");

// ─── Register system fonts ────────────────────────────────────────────────────
const FONT_PATH   = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_B_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
try {
    registerFont(FONT_PATH,   { family: "DejaVu", weight: "normal" });
    registerFont(FONT_B_PATH, { family: "DejaVu", weight: "bold"   });
} catch (_) {}

// ─── WhatsApp dark theme palette ─────────────────────────────────────────────
const COLORS = {
    outerBg:    "#0B141A",
    headerBg:   "#1F2C34",
    chatBg:     "#0B141A",
    bubbleBg:   "#1F2C34",
    bubbleOut:  "#005C4B",
    accentGreen:"#00A884",
    textMain:   "#E9EDEF",
    textSub:    "#8696A0",
    headerText: "#FFFFFF",
    divider:    "#2A3942",
    tick:       "#53BDEB",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
    const lines = [];
    for (const paragraph of text.split("\n")) {
        if (!paragraph.trim()) { lines.push(""); continue; }
        const words = paragraph.split(" ");
        let current = "";
        for (const word of words) {
            const candidate = current ? current + " " + word : word;
            if (ctx.measureText(candidate).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        }
        if (current) lines.push(current);
    }
    return lines.length ? lines : [""];
}

function drawAvatar(ctx, img, x, y, size, fallbackLetter) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img) {
        ctx.drawImage(img, x, y, size, size);
    } else {
        const grad = ctx.createLinearGradient(x, y, x + size, y + size);
        grad.addColorStop(0, "#00A884");
        grad.addColorStop(1, "#005C4B");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.floor(size * 0.4)}px DejaVu`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((fallbackLetter || "?").toUpperCase(), x + size / 2, y + size / 2);
    }
    ctx.restore();
}

function drawTicks(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = COLORS.tick;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x,      y + 4);
    ctx.lineTo(x + 4,  y + 8);
    ctx.lineTo(x + 10, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 4,  y + 4);
    ctx.lineTo(x + 8,  y + 8);
    ctx.lineTo(x + 14, y);
    ctx.stroke();
    ctx.restore();
}

async function fetchProfilePic(sock, jid) {
    try {
        const url = await sock.profilePictureUrl(jid, "image");
        if (!url) return null;
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
        return await loadImage(Buffer.from(res.data));
    } catch (_) {
        return null;
    }
}

// ─── Main command ─────────────────────────────────────────────────────────────

async function screenshotCommand(sock, chatId, message) {
    const lang = getLang(sock);
    const ctx_info = message.message?.extendedTextMessage?.contextInfo;

    if (!ctx_info?.quotedMessage) {
        return await sock.sendMessage(chatId, {
            text: lang.screenshot_msg_usage
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

        const quotedMsg   = ctx_info.quotedMessage;
        const senderJid   = ctx_info.participant || "";
        const senderNum   = "+" + senderJid.split("@")[0];
        const displayName = ctx_info.pushName || senderNum;

        const rawText =
            quotedMsg.conversation ||
            quotedMsg.extendedTextMessage?.text ||
            quotedMsg.imageMessage?.caption   ||
            quotedMsg.videoMessage?.caption   ||
            quotedMsg.documentMessage?.caption ||
            (quotedMsg.imageMessage   ? "📷  Photo"   : null) ||
            (quotedMsg.videoMessage   ? "🎥  Video"   : null) ||
            (quotedMsg.audioMessage   ? "🎤  Audio"   : null) ||
            (quotedMsg.stickerMessage ? "🏷️  Sticker"  : null) ||
            "Message";

        const tsRaw  = ctx_info.quotedMessage?.messageContextInfo?.messageTimestamp;
        const tsDate = tsRaw ? new Date(Number(tsRaw) * 1000) : new Date();
        const timeStr = tsDate.getHours().toString().padStart(2, "0") + ":" +
                        tsDate.getMinutes().toString().padStart(2, "0");

        const profileImg = senderJid ? await fetchProfilePic(sock, senderJid) : null;

        const CANVAS_W   = 640;
        const HEADER_H   = 58;
        const PADDING    = 14;
        const AVATAR_SIZE= 40;
        const BUBBLE_MAX = CANVAS_W - 80;
        const BUBBLE_MIN = 160;
        const FONT_SIZE  = 16;
        const LINE_H     = FONT_SIZE + 8;

        const measureCtx = createCanvas(CANVAS_W, 100).getContext("2d");
        measureCtx.font = `${FONT_SIZE}px DejaVu`;
        const textLines = wrapText(measureCtx, rawText, BUBBLE_MAX - 80);

        const nameFont   = `bold 14px DejaVu`;
        const bodyFont   = `${FONT_SIZE}px DejaVu`;
        const smallFont  = `11px DejaVu`;

        const innerW     = Math.min(BUBBLE_MAX, Math.max(
            BUBBLE_MIN,
            ...textLines.map(l => measureCtx.measureText(l).width + 80)
        ));
        const textBlockH = textLines.length * LINE_H;
        const BUBBLE_H   = 12 + 20 + 8 + textBlockH + 24;
        const BUBBLE_X   = AVATAR_SIZE + PADDING * 2 + 4;
        const BUBBLE_Y   = HEADER_H + PADDING;

        const TOTAL_H    = BUBBLE_Y + BUBBLE_H + PADDING * 2 + 30;

        const canvas = createCanvas(CANVAS_W, TOTAL_H);
        const ctx    = canvas.getContext("2d");

        ctx.fillStyle = COLORS.chatBg;
        ctx.fillRect(0, 0, CANVAS_W, TOTAL_H);

        ctx.fillStyle = COLORS.headerBg;
        ctx.fillRect(0, 0, CANVAS_W, HEADER_H);

        ctx.strokeStyle = COLORS.headerText;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(22, HEADER_H / 2);
        ctx.lineTo(13, HEADER_H / 2 - 7);
        ctx.lineTo(13, HEADER_H / 2 + 7);
        ctx.closePath();
        ctx.fillStyle = COLORS.headerText;
        ctx.fill();

        drawAvatar(ctx, profileImg, 34, (HEADER_H - 36) / 2, 36, displayName[0]);

        ctx.fillStyle = COLORS.headerText;
        ctx.font = `bold 15px DejaVu`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(displayName, 82, 12);
        ctx.fillStyle = COLORS.textSub;
        ctx.font = `12px DejaVu`;
        ctx.fillText("online", 82, 30);

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(CANVAS_W - 18, 18 + i * 10, 2, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.textSub;
            ctx.fill();
        }

        drawAvatar(ctx, profileImg, PADDING, BUBBLE_Y + 4, AVATAR_SIZE, displayName[0]);

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur  = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        roundedRect(ctx, BUBBLE_X, BUBBLE_Y, innerW, BUBBLE_H, 10);
        ctx.fillStyle = COLORS.bubbleBg;
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = COLORS.bubbleBg;
        ctx.beginPath();
        ctx.moveTo(BUBBLE_X, BUBBLE_Y + 8);
        ctx.lineTo(BUBBLE_X - 8, BUBBLE_Y + 2);
        ctx.lineTo(BUBBLE_X, BUBBLE_Y + 20);
        ctx.closePath();
        ctx.fill();

        ctx.font = nameFont;
        ctx.fillStyle = COLORS.accentGreen;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(displayName, BUBBLE_X + 12, BUBBLE_Y + 10);

        ctx.font = bodyFont;
        ctx.fillStyle = COLORS.textMain;
        const textStartY = BUBBLE_Y + 10 + 20 + 6;
        for (let i = 0; i < textLines.length; i++) {
            ctx.fillText(textLines[i], BUBBLE_X + 12, textStartY + i * LINE_H);
        }

        const tsY = BUBBLE_Y + BUBBLE_H - 18;
        ctx.font = smallFont;
        ctx.fillStyle = COLORS.textSub;
        ctx.textAlign = "right";
        ctx.fillText(timeStr, BUBBLE_X + innerW - 36, tsY);
        drawTicks(ctx, BUBBLE_X + innerW - 34, tsY - 1);

        ctx.font = `11px DejaVu`;
        ctx.fillStyle = "#546E7A";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Queen Riam", CANVAS_W / 2, TOTAL_H - 6);

        const imgBuffer = canvas.toBuffer("image/png");

        await sock.sendMessage(chatId, {
            image: imgBuffer,
            mimetype: "image/png"
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (err) {
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, {
            text: lang.screenshot_msg_error
        }, { quoted: message });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['screenshot'],
  description: 'Take a screenshot',
  category: 'tools',
  hidden: true,
}, async (sock, chatId, message) => {
  await screenshotCommand(sock, chatId, message);
});