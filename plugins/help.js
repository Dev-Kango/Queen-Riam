// Migrated from commands/help.js

const settings    = require('../settings');
const { getLang } = require('../lib/lang');
const fs          = require('fs');
const path        = require('path');
const { isButtonModeOn } = require('../lib/buttonHelper');
const { pluginMap } = require('../lib/pluginLoader');
const { readRandomBrandImage } = require('../lib/imagePicker');

let sendButtons;
try {
    sendButtons = require('kango-wa').sendButtons;
} catch (_) {
    sendButtons = null;
}

function formatTime(seconds) {
    const days    = Math.floor(seconds / (24 * 60 * 60));
    seconds       = seconds % (24 * 60 * 60);
    const hours   = Math.floor(seconds / (60 * 60));
    seconds       = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds       = Math.floor(seconds % 60);

    let time = '';
    if (days    > 0) time += `${days}d `;
    if (hours   > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

const CATEGORY_META = {
    ai:       { emoji: '🤖', title: 'AI'       },
    download: { emoji: '📥', title: 'Download'  },
    fun:      { emoji: '🎯', title: 'Fun'       },
    games:    { emoji: '🎮', title: 'Games'     },
    group:    { emoji: '👥', title: 'Group'     },
    general:  { emoji: '🌐', title: 'General'   },
    owner:    { emoji: '🔒', title: 'Owner'     },
    photo:    { emoji: '🎨', title: 'Photo'     },
    religion: { emoji: '✝️', title: 'Religion'  },
    tools:    { emoji: '💻', title: 'Tools'     },
    text:     { emoji: '🔤', title: 'Text Art'  },
};

const CATEGORY_ORDER = ['ai','download','fun','games','general','group','owner','photo','religion','text','tools'];

function getCommandsByCategory(categoryKey) {
    const seen  = new Set();
    const cmds  = [];
    for (const [cmdName, { meta }] of pluginMap) {
        if ((meta.category || 'general') !== categoryKey) continue;
        if (meta.hidden) continue;
        const primary = Array.isArray(meta.command) ? meta.command[0] : meta.command;
        if (cmdName !== primary) continue;
        const menuCommands = Array.isArray(meta.menuCommands)
            ? meta.menuCommands
            : [primary];
        for (const menuCommand of menuCommands) {
            const normalized = String(menuCommand || '').toLowerCase().trim();
            if (!normalized || seen.has(normalized)) continue;
            seen.add(normalized);
            cmds.push('.' + normalized);
        }
    }
    return cmds;
}

function getHeader() {
    const currentTime = new Date().toLocaleString('en-US', {
        timeZone: settings.timezone,
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const currentDate = new Date().toLocaleString('en-US', {
        timeZone: settings.timezone,
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const uptimeFormatted = formatTime(process.uptime());
    const botMode = settings.commandMode === 'public' ? 'public' : 'private';

    return `*『 👑 𝚀𝚄𝙴𝙴𝙽 𝚁𝙸𝙰𝙼 』*
*│ 👤 ᴏᴡɴᴇʀ     : ${settings.botOwner}*
*│ 🌍 ᴍᴏᴅᴇ      : [ ${botMode} ]*
*│ ⏰ ᴛɪᴍᴇ      : ${currentTime}*
*│ 📅 ᴅᴀᴛᴇ      : ${currentDate}*
*│ 🛠️ ᴘʀᴇғɪx    : [ . ]*
*│ 🔄 ᴜᴘᴛɪᴍᴇ    : ${uptimeFormatted}*
*│ 🌐 ᴛɪᴍᴇᴢᴏɴᴇ : ${settings.timezone}*
*│ 🚀 ᴠᴇʀsɪᴏɴ   : ${settings.version}*
*╰─────────⟢*`;
}

function getCatTitle(key, sock) {
    const map = {
        ai:       'help_cat_ai',
        download: 'help_cat_download',
        fun:      'help_cat_fun',
        games:    'help_cat_games',
        group:    'help_cat_group',
        general:  'help_cat_general',
        owner:    'help_cat_owner',
        photo:    'help_cat_photo',
        religion: 'help_cat_religion',
        tools:    'help_cat_tools',
        text:     'help_cat_text',
    };
    const langKey = map[key];
    const lang    = getLang(sock);
    return (langKey && lang[langKey]) ? lang[langKey] : (CATEGORY_META[key]?.title || key);
}

function buildCategoryText(key, sock) {
    const cat  = CATEGORY_META[key];
    if (!cat) return null;
    const cmds = getCommandsByCategory(key);
    if (!cmds.length) return null;

    let text = `*『 ${cat.emoji} ${getCatTitle(key, sock)} ${getLang(sock).help_menu_suffix || 'Menu'} 』*\n`;
    for (const cmd of cmds) {
        text += `*│ ⬡ ${cmd}*\n`;
    }
    text += `*╰─────────⟢*`;
    return text;
}

function buildFullMenu(sock) {
    let text = getHeader() + '\n';
    for (const key of CATEGORY_ORDER) {
        const block = buildCategoryText(key, sock);
        if (block) text += '\n' + block + '\n';
    }
    text += '\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝚀𝚄𝙴𝙴𝙽 𝚁𝙸𝙰𝙼*';
    return text;
}

async function sendMenuAudio(sock, chatId) {
    const audioPath1 = path.join(__dirname, '../media/menu.mp3');
    const audioPath2 = path.join(__dirname, '../media/menu2.mp3');
    const tracks     = [audioPath1, audioPath2];
    const chosen     = tracks[Math.floor(Math.random() * tracks.length)];

    if (fs.existsSync(chosen)) {
        const audioBuffer = fs.readFileSync(chosen);
        await sock.sendMessage(chatId, {
            audio:    audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: 'menu.mp3',
            ptt:      false,
        });
    }
}

async function sendWithImage(sock, chatId, text) {
    const imageBuffer = readRandomBrandImage();
    if (imageBuffer) {
        await sock.sendMessage(chatId, {
            image:       imageBuffer,
            caption:     text,
        });
    } else {
        await sock.sendMessage(chatId, {
            text,
        });
    }
}

function loadMenuImage() {
    return readRandomBrandImage();
}

async function helpCommand(sock, chatId, message, _, subCategory) {
    const menuImage = loadMenuImage();

    if (subCategory && CATEGORY_META[subCategory]) {
        const block = buildCategoryText(subCategory, sock);
        if (!block) {
            await sock.sendMessage(chatId, { text: 'No commands in that category yet.' });
            return;
        }
        const catText = block + '\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝚀𝚄𝙴𝙴𝙽 𝚁𝙸𝙰𝙼*';

        if (isButtonModeOn() && sendButtons) {
            try {
                const opts = {
                    text:        catText,
                    footer:      '© Queen Riam',
                    buttons:     [{ id: '.help', text: getLang(sock).help_back_btn }],
                };
                if (menuImage) opts.image = menuImage;
                await sendButtons(sock, chatId, opts);
            } catch (_) {
                await sendWithImage(sock, chatId, catText);
            }
        } else {
            await sendWithImage(sock, chatId, catText);
        }
        return;
    }

    if (isButtonModeOn() && sendButtons) {
        try {
            const menuText = getHeader() + '\n\n' + getLang(sock).help_tap_category;

            const buttons = CATEGORY_ORDER
                .filter(key => CATEGORY_META[key] && getCommandsByCategory(key).length)
                .map(key => ({
                    id:   `.help ${key}`,
                    text: `${CATEGORY_META[key].emoji} ${getCatTitle(key, sock)}`,
                }));

            const opts = {
                text:        menuText,
                footer:      '© Queen Riam',
                buttons,
            };
            if (menuImage) opts.image = menuImage;
            await sendButtons(sock, chatId, opts);
            await sendMenuAudio(sock, chatId);
            return;
        } catch (err) {
            console.error('[HELP] Button menu failed, falling back to full menu:', err.message);
        }
    }

    const fullMenu = buildFullMenu(sock);

    try {
        await sendWithImage(sock, chatId, fullMenu);
        await sendMenuAudio(sock, chatId);
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: fullMenu });
    }
}




const { bot } = require('../lib/pluginLoader');

bot({
  command: ['help', 'menu', 'bot', 'list'],
  description: 'Show command menu',
  category: 'general',
}, async (sock, chatId, message, args) => {
  await helpCommand(sock, chatId, message, settings.channelLink, args[0]?.toLowerCase());
});