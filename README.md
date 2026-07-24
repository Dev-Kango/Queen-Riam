<h1 align="center">👑 QUEEN RIAM</h1>

<p align="center">
  <img src="https://i.imgur.com/6H0FXSa.jpeg" alt="Queen Riam" width="300" style="border-radius: 12px;" />
</p>

<p align="center">
  <a href="https://github.com/Dev-Kango"><img src="https://img.shields.io/badge/GitHub-DevKango-181717?style=for-the-badge&logo=github" /></a>
  <a href="https://wa.me/233509977126"><img src="https://img.shields.io/badge/WhatsApp-Contact-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/Dev-Kango/Queen-Riam?color=FFD700&style=flat-square" alt="Stars" />
  <img src="https://img.shields.io/github/forks/Dev-Kango/Queen-Riam?color=00BFFF&style=flat-square" alt="Forks" />
  <img src="https://img.shields.io/github/watchers/Dev-Kango/Queen-Riam?label=Watchers&color=orange&style=flat-square" alt="Watchers" />
  <img src="https://img.shields.io/github/repo-size/Dev-Kango/Queen-Riam?color=green&style=flat-square" alt="Repo Size" />
  <img src="https://komarev.com/ghpvc/?username=Dev-Kango&label=Views&color=blue&style=flat-square" alt="Views" />
</p>

---

## About

**QUEEN RIAM** is a modern WhatsApp multi-device bot built with **Node.js**, **Baileys v7**, and **Express**. Designed for simplicity, extensibility, and reliable automation for both group and personal chats.

- 🔌 Drop-in plugin system — add commands without touching core files
- 🗄️ Flexible session storage — local folder, SQLite, PostgreSQL, MySQL, MongoDB, Supabase, or Redis
- 🌍 Multi-language support — EN, ES, PT, FR, HA, HI
- 🔞 NSFW category (18+ toggle, 20 commands via pic.re)
- ⚡ Hot-reload — plugins reload without restarting the bot
- 🐳 Docker-ready and one-click deployable

> Please use responsibly and for educational purposes only.

---

## Session Pairing

Generate your Session ID to connect your WhatsApp account:

<p align="center">
  <a href="https://pair.officialkango.space" target="_blank">
    <img src="https://img.shields.io/badge/Get%20Session%20ID-000000?style=for-the-badge&logo=whatsapp&logoColor=25D366" alt="Get Session ID" />
  </a>
</p>

---

## Deploy

Deploy QUEEN RIAM with one click on any supported platform:

<p align="center">
  <a href="https://dashboard.heroku.com/new?template=https://github.com/Dev-Kango/Queen-Riam"><img src="https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white" /></a>
  <a href="https://railway.com/deploy/VyW5O7?referralCode=wXCnaU&utm_medium=integration&utm_source=template&utm_campaign=generic"><img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" /></a>
  <a href="https://dashboard.render.com/web/new"><img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" /></a>
  <a href="https://app.koyeb.com/services/deploy?type=git&repository=Dev-Kango/Queen-Riam-"><img src="https://img.shields.io/badge/Koyeb-121212?style=for-the-badge&logo=koyeb&logoColor=white" /></a>
  <a href="https://dashboard.katabump.com/auth/login#14aeb2"><img src="https://img.shields.io/badge/KataBump-5B4B8A?style=for-the-badge&logo=rocket&logoColor=white" /></a>
</p>

**VPS / Pterodactyl:** Clone the repo, copy `.env.example` → `.env`, fill in your values, run `npm install && npm start`. Use PM2 to keep it alive: `pm2 start index.js --name queen-riam`.

---

## Features

| Feature | Description |
|---------|-------------|
| **Plugin System** | Drop any `.js` file into `plugins/` — it auto-loads, no restarts needed |
| **Hot Reload** | Live plugin reload via file watcher (chokidar) |
| **Multi-Device** | Full multi-device support via Baileys v7 RC |
| **Session Backends** | Local folder (default), SQLite, PostgreSQL, MySQL, MongoDB, Supabase, Redis |
| **Command Modes** | `public` (anyone) or `private` (owner/sudo only) |
| **NSFW Category** | 20 image commands via pic.re — 18+ gated, no API key required |
| **Auto Features** | Auto-status react/reply, auto-read, auto-type, auto-record |
| **Multi-Language** | EN, ES, PT, FR, HA, HI — switchable per group |
| **Group Tools** | Anti-link, anti-bad-word, anti-delete, welcome/goodbye, warn system |
| **AI Commands** | Gemini, GPT, DeepSeek, image generation integrations |
| **One-Click Deploy** | Heroku, Railway, Render, Koyeb, KataBump, VPS, Docker |
| **Truecaller Lookup** | Phone number lookup with per-user cooldown |
| **Clean Logging** | User-friendly logs, pino silent mode in production |

---

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | `>= 20.x` |
| npm | `>= 10.x` |
| Git | Latest |
| FFmpeg | Required for media commands |
| WhatsApp | Active mobile account |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Dev-Kango/Queen-Riam.git
cd Queen-Riam

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env
# Open .env and fill in OWNER_NUMBER, BOT_NAME, etc.

# 4. Run
npm start

# Keep alive with PM2
pm2 start index.js --name queen-riam
pm2 save
```

On first run the bot will print a **pairing code** in the terminal. Open WhatsApp → Linked Devices → Link with Phone Number and enter the code.

---

## Environment Variables

Copy `.env.example` to `.env`. Everything except `OWNER_NUMBER` has a safe default.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OWNER_NUMBER` | ✅ | — | Your WhatsApp number (country code, no `+`). E.g. `233501234567` |
| `BOT_NAME` | — | `Queen Riam` | Name shown in menus and headers |
| `BOT_OWNER` | — | `Your Name` | Owner display name |
| `PACK_NAME` | — | `Queen Riam` | Sticker pack name |
| `PACK_AUTHOR` | — | `Your Name` | Sticker pack author |
| `PREFIX` | — | `.` | Command prefix (`.`, `!`, `/`, etc.) |
| `TIMEZONE` | — | `Africa/Lagos` | Your timezone for time-based features |
| `COMMAND_MODE` | — | `public` | `public` = anyone can use · `private` = owner/sudo only |
| `SESSION_ID` | — | — | Base64 session from the pairing site. Leave blank to pair via code |
| `DB_TYPE` | — | *(blank)* | Session storage backend — see table below |
| `AUTO_STATUS_REACT` | — | `false` | Auto-react to contacts' statuses |
| `AUTO_STATUS_REPLY` | — | `false` | Auto-reply to contacts' statuses |
| `AUTO_STATUS_MSG` | — | `Status Viewed` | Message sent when auto-replying to status |
| `AUTOREAD` | — | `false` | Mark all incoming messages as read |
| `AUTOTYPE` | — | `false` | Show typing indicator before replying |
| `AUTORECORD` | — | `false` | Show recording indicator before voice replies |
| `AUTORECORDTYPE` | — | `false` | Combined typing + recording indicator |
| `GIPHY_API_KEY` | — | — | Optional. Get free at [giphy.com/developers](https://developers.giphy.com) |

### Session Storage Backends (`DB_TYPE`)

Leave `DB_TYPE` blank on a **VPS or Pterodactyl** — sessions are saved to the `/session` folder on disk by default.

On platforms that **wipe the filesystem on restart** (Render free tier, Heroku, Railway ephemeral dynos) you **must** set `DB_TYPE` or the bot will re-pair on every restart.

| `DB_TYPE` | Best for | Extra variable needed |
|-----------|----------|-----------------------|
| *(blank)* | VPS, Pterodactyl, local | — |
| `sqlite` | VPS, single-file backup | `SQLITE_PATH` (optional) |
| `postgres` | Railway, Neon, Heroku Postgres | `DATABASE_URL` |
| `mysql` | Railway MySQL, PlanetScale | `DATABASE_URL` |
| `mongodb` | MongoDB Atlas (free 512MB) | `MONGO_URI` |
| `supabase` | Supabase (free 500MB, no card) | `SUPABASE_DB_URL` |
| `redis` | Render, Railway Redis, Upstash | `REDIS_URL` |

---

## 🔌 Plugin Development Guide

Plugins are the heart of Queen Riam. Every command is a plugin — drop a `.js` file into the `plugins/` folder and it auto-loads instantly. No core file edits, no restarts required.

### How it works

The bot exposes a global `bot()` function. Call it with a config object and a handler function:

```js
const { bot } = require('../lib/pluginLoader');

bot({
  command: 'hello',
  description: 'Say hello',
  category: 'fun',
}, async (sock, chatId, message, args, query, ctx) => {
  await sock.sendMessage(chatId, { text: 'Hello! 👋' }, { quoted: message });
});
```

That's it. Save the file and the bot picks it up automatically.

---

### Handler Arguments

Every handler receives exactly these 6 arguments:

| Argument | Type | Description |
|----------|------|-------------|
| `sock` | Object | The Baileys socket — use this to send messages, reactions, etc. |
| `chatId` | String | The chat JID — where the message came from (group or private) |
| `message` | Object | The full raw Baileys message object |
| `args` | Array | Words after the command. `.weather Accra` → `args = ['Accra']` |
| `query` | String | Everything after the command joined as a string. `.weather Accra Ghana` → `'Accra Ghana'` |
| `ctx` | Object | Context helpers — see table below |

### The `ctx` Object

`ctx` gives you everything you need without digging into raw Baileys structures:

| Property | Type | Description |
|----------|------|-------------|
| `ctx.c` | String | The matched command name (without prefix). Use this, not `ctx.command` |
| `ctx.senderId` | String | Sender's WhatsApp JID (`2348012345678@s.whatsapp.net`) |
| `ctx.senderNumber` | String | Sender's number as a plain string |
| `ctx.isGroup` | Boolean | `true` if the message came from a group |
| `ctx.isOwner` | Boolean | `true` if the sender is the bot owner |
| `ctx.isSudo` | Boolean | `true` if the sender is a sudo/admin user |
| `ctx.isAdmin` | Boolean | `true` if the sender is a group admin |
| `ctx.isBotAdmin` | Boolean | `true` if the bot itself is a group admin |
| `ctx.pushName` | String | Sender's display name |
| `ctx.quoted` | Object\|null | The message being replied to (if any) |
| `ctx.quotedText` | String\|null | Text content of the quoted message |
| `ctx.mime` | String\|null | MIME type of the quoted/attached media |

---

### Plugin Config Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `command` | String \| Array | ✅ | Command name(s) without the prefix |
| `description` | String | ✅ | Shows in `.help` menus |
| `category` | String | — | Which menu section it appears under (default: `general`) |
| `usage` | String | — | Usage hint shown in help. E.g. `'<city>'` |
| `hidden` | Boolean | — | `true` = registered but invisible in help menus |
| `ownerOnly` | Boolean | — | Restrict to owner only (enforced in core) |
| `groupOnly` | Boolean | — | Only works in groups |
| `privateOnly` | Boolean | — | Only works in private/DM chats |
| `on` | String | — | Register an event listener instead of a command (see Events) |

---

### Available Categories

| Category | Emoji | Use for |
|----------|-------|---------|
| `ai` | 🤖 | AI / LLM commands |
| `download` | 📥 | Media downloaders |
| `fun` | 🎯 | Fun, jokes, memes, games |
| `games` | 🎮 | Interactive games |
| `general` | 🌐 | Miscellaneous / uncategorised |
| `group` | 👥 | Group management commands |
| `nsfw` | 🔞 | 18+ content |
| `owner` | 🔒 | Owner/admin only |
| `photo` | 🎨 | Image manipulation |
| `religion` | ✝️ | Bible, Quran, prayer commands |
| `text` | 🔤 | Text art, fonts, ASCII |
| `tools` | 💻 | Utilities, lookups, converters |

---

### Examples

#### ✅ Simple text reply

```js
const { bot } = require('../lib/pluginLoader');

bot({
  command: 'ping',
  description: 'Check if the bot is alive',
  category: 'general',
}, async (sock, chatId, message) => {
  await sock.sendMessage(chatId, { text: '🏓 Pong!' }, { quoted: message });
});
```

---

#### ✅ Multiple command aliases

```js
bot({
  command: ['hi', 'hey', 'hello'],
  description: 'Greet the bot',
  category: 'fun',
}, async (sock, chatId, message, args, query, ctx) => {
  await sock.sendMessage(chatId, {
    text: `Hey *${ctx.pushName}*! 👋`,
  }, { quoted: message });
});
```

---

#### ✅ Using args and query

```js
bot({
  command: 'say',
  description: 'Make the bot repeat something',
  category: 'fun',
  usage: '<text>',
}, async (sock, chatId, message, args, query) => {
  if (!query) {
    return sock.sendMessage(chatId, { text: '❌ Give me something to say!' }, { quoted: message });
  }
  await sock.sendMessage(chatId, { text: query }, { quoted: message });
});
```

---

#### ✅ Owner-only command

```js
bot({
  command: 'broadcast',
  description: 'Send a message to all groups',
  category: 'owner',
  ownerOnly: true,
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isOwner) {
    return sock.sendMessage(chatId, { text: '🔒 Owner only.' }, { quoted: message });
  }
  // your broadcast logic here
  await sock.sendMessage(chatId, { text: '✅ Broadcast sent.' }, { quoted: message });
});
```

---

#### ✅ Sending an image from a URL

```js
const axios = require('axios');
const { bot } = require('../lib/pluginLoader');

bot({
  command: 'dog',
  description: 'Get a random dog picture',
  category: 'fun',
}, async (sock, chatId, message) => {
  const { data } = await axios.get('https://dog.ceo/api/breeds/image/random');
  const imageUrl = data.message;

  // Download as buffer
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);

  await sock.sendMessage(chatId, {
    image: buffer,
    caption: '🐶 Woof!',
  }, { quoted: message });
});
```

---

#### ✅ Sending a reaction

```js
// React with an emoji on the sender's message
await sock.sendMessage(chatId, {
  react: { text: '✅', key: message.key },
});
```

---

#### ✅ Group-only command with admin check

```js
bot({
  command: 'mute',
  description: 'Mute the group (bot must be admin)',
  category: 'group',
  groupOnly: true,
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isBotAdmin) {
    return sock.sendMessage(chatId, { text: '❌ Make me an admin first.' }, { quoted: message });
  }
  await sock.groupSettingUpdate(chatId, 'announcement'); // lock group
  await sock.sendMessage(chatId, { text: '🔇 Group muted.' }, { quoted: message });
});
```

---

#### ✅ Reading a quoted message

```js
bot({
  command: 'quote',
  description: 'Quote the replied message',
  category: 'fun',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.quoted) {
    return sock.sendMessage(chatId, { text: '↩️ Reply to a message first.' }, { quoted: message });
  }
  await sock.sendMessage(chatId, {
    text: `*Quoted:*\n${ctx.quotedText}`,
  }, { quoted: message });
});
```

---

#### ✅ Fetching from an API with error handling

```js
const axios = require('axios');
const { bot } = require('../lib/pluginLoader');
const getFakeVcard = require('../lib/fakeVcard');

bot({
  command: 'weather',
  description: 'Get current weather for a city',
  category: 'tools',
  usage: '<city>',
}, async (sock, chatId, message, args, query) => {
  if (!query) {
    return sock.sendMessage(chatId, { text: '🌍 Usage: .weather Accra' }, { quoted: message });
  }

  try {
    const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(query)}?format=3`);
    await sock.sendMessage(chatId, { text: `🌤️ ${data}` }, { quoted: message });
  } catch (err) {
    console.error('[weather] Error:', err.message);
    await sock.sendMessage(chatId,
      { text: '❌ Could not fetch weather. Try again later.' },
      { quoted: getFakeVcard() }
    );
  }
});
```

---

#### ✅ Event listener (no command trigger)

Use `on` instead of `command` to listen for raw events:

```js
const { bot } = require('../lib/pluginLoader');

bot({
  on: 'message',          // fires on every incoming message
  description: 'Logger',
  hidden: true,
}, async (sock, chatId, message, args, query, ctx) => {
  if (ctx.isGroup) {
    console.log(`[${chatId}] ${ctx.pushName}: ${query}`);
  }
});
```

Available event types: `message`, `group-participants`, `call`, `status`.

---

### Tips & Best Practices

- **One file, one feature.** Keep each plugin focused — it's easier to debug and share.
- **Always handle errors.** Wrap API calls in `try/catch` and send a friendly message instead of crashing.
- **Use `ctx.c`** (not `ctx.command`) to get the matched command name inside a multi-alias plugin.
- **Never hardcode numbers or keys.** Use `.env` variables for anything sensitive.
- **Use `getFakeVcard()`** as the `quoted` message when you need to quote something without referring to a real message (looks cleaner than quoting the bot itself).
- **Cooldowns.** For API-heavy commands use a `Map` keyed on `ctx.senderId` to throttle per-user requests.
- **`axios` and `node-fetch` are both available.** Prefer `axios` for JSON APIs — it throws on non-2xx responses automatically when using `.get()`.
- **Media downloads.** For large files, stream directly into a buffer with `axios({ responseType: 'arraybuffer' })` and pass the `Buffer` to `sendMessage`.
- **Hidden commands.** Set `hidden: true` to register a command that works but doesn't appear in `.help` — useful for aliases, debug commands, or internal triggers.

---

### Plugin File Template

Copy this as a starting point for any new plugin:

```js
// plugins/myplugin.js

const { bot } = require('../lib/pluginLoader');
const getFakeVcard = require('../lib/fakeVcard');
// const axios = require('axios'); // uncomment if you need HTTP requests

bot({
  command: ['mycommand'],        // add aliases: ['mycommand', 'mc']
  description: 'What it does',
  category: 'general',          // see category table above
  usage: '<optional arg>',      // shown in .help mycommand
}, async (sock, chatId, message, args, query, ctx) => {
  try {

    // Guard: only run in groups
    // if (!ctx.isGroup) return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });

    // Guard: require an argument
    // if (!query) return sock.sendMessage(chatId, { text: `Usage: ${ctx.c} <arg>` }, { quoted: message });

    // React to acknowledge
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    // --- Your logic here ---
    const reply = 'Hello from my plugin!';

    // Send reply
    await sock.sendMessage(chatId, { text: reply }, { quoted: message });

  } catch (err) {
    console.error(`[${ctx.c}] Error:`, err.message);
    await sock.sendMessage(chatId,
      { text: '❌ Something went wrong. Please try again.' },
      { quoted: getFakeVcard() }
    );
  }
});
```

---

## Docker

```bash
# Build
docker build -t queen-riam .

# Run (pass SESSION_ID to skip pairing)
docker run -d \
  --name queen-riam \
  --env-file .env \
  -e SESSION_ID=your_session_id \
  queen-riam
```

---

## Credits

| Contributor | Link |
|-------------|------|
| **DevKango** | [github.com/Dev-Kango](https://github.com/Dev-Kango) |
| **OfficialKango** | [github.com/OfficialKango](https://github.com/OfficialKango) |
| **Baileys** | [github.com/WhiskeySockets](https://github.com/WhiskeySockets) |

---

## Notice

> **Educational use only.** Do not use this bot for spam, harassment, or any illegal activities. WhatsApp may ban accounts that violate their Terms of Service.

---

<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=18&pause=1000&color=F94E8B&center=true&vCenter=true&width=500&lines=QUEEN+RIAM+MD;MADE+BY+HECTOR+MANUEL;THANKS+FOR+VISITING" alt="Typing SVG" />
  </a>
</p>

<p align="center">Made with love in Ghana by Hector Manuel</p>
