<h1 align="center">👑 QUEEN RIAM</h1>

<p align="center">
  <img src="https://i.postimg.cc/4xrFDjGC/Screenshot-20260728-032831-Photos.png" alt="Queen Riam" width="300" style="border-radius: 12px;" />
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

**QUEEN RIAM** is a modern WhatsApp multi-device bot built with **Node.js** and **Baileys**. It works in both group and private chats, supports multiple languages, and lets you install extra commands instantly — no coding required.

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

<p align="center">
  <a href="https://dashboard.heroku.com/new?template=https://github.com/Dev-Kango/Queen-Riam"><img src="https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white" /></a>
  <a href="https://railway.com/deploy/VyW5O7?referralCode=wXCnaU&utm_medium=integration&utm_source=template&utm_campaign=generic"><img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" /></a>
  <a href="https://dashboard.render.com/web/new"><img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" /></a>
  <a href="https://app.koyeb.com/services/deploy?type=git&repository=Dev-Kango/Queen-Riam-"><img src="https://img.shields.io/badge/Koyeb-121212?style=for-the-badge&logo=koyeb&logoColor=white" /></a>
  <a href="https://dashboard.katabump.com/auth/login#14aeb2"><img src="https://img.shields.io/badge/KataBump-5B4B8A?style=for-the-badge&logo=rocket&logoColor=white" /></a>
</p>

**VPS / Pterodactyl:**
```bash
git clone https://github.com/Dev-Kango/Queen-Riam.git
cd Queen-Riam
npm install
cp .env.example .env   # fill in your values
npm start
```

---

## Features

| | Feature |
|--|---------|
| 🔌 | Install extra commands instantly via a link — no coding needed |
| ♻️ | Plugins load live — no restart required |
| 📱 | Full multi-device support |
| 🌍 | Multi-language — EN, ES, PT, FR, HA, HI |
| 🔞 | NSFW category (18+, 20 commands, owner-toggled) |
| 👥 | Group tools — anti-link, anti-bad-word, welcome/goodbye, warn system |
| 🤖 | AI commands — Gemini, GPT, DeepSeek, image generation |
| ⚙️ | Auto-status react/reply, auto-read, auto-type |
| 🗄️ | Session storage — local folder, Supabase, PostgreSQL, MySQL, MongoDB, Redis |
| 🐳 | Docker-ready |

---

## Setup

### 1. Fill in your `.env`

Copy `.env.example` to `.env` and set these values:

| Variable | What it is |
|----------|------------|
| `OWNER_NUMBER` | Your WhatsApp number with country code — no `+`. Example: `233501234567` |
| `BOT_NAME` | What you want the bot to call itself |
| `BOT_OWNER` | Your display name |
| `PREFIX` | The symbol before commands. Default is `.` |
| `TIMEZONE` | Your timezone. Example: `Africa/Accra`, `America/New_York` |
| `COMMAND_MODE` | `public` — anyone can use commands · `private` — only you |
| `SESSION_ID` | Leave blank to pair by code, or paste your ID from the pairing site |

Everything else in `.env.example` is optional with safe defaults already set.

### 2. Session Storage

By default the bot saves its session to a folder on disk — perfect for VPS and Pterodactyl.

If you're on a platform that **wipes files on restart** (Render free, Heroku, Railway), you need a database backend or the bot will ask you to re-pair every time. Set `DB_TYPE` in your `.env`:

| `DB_TYPE` value | Platform |
|-----------------|----------|
| *(leave blank)* | VPS, Pterodactyl, local machine |
| `supabase` | [supabase.com](https://supabase.com) — free, no card needed |
| `mongodb` | [MongoDB Atlas](https://cloud.mongodb.com) — free 512 MB |
| `postgres` | Railway Postgres, Neon, Heroku Postgres |
| `redis` | Railway Redis, Render Redis, Upstash |
| `sqlite` | VPS single-file option |
| `mysql` | Railway MySQL, PlanetScale |

Then set the matching connection variable (e.g. `SUPABASE_DB_URL`, `MONGO_URI`, `DATABASE_URL`, `REDIS_URL`). All examples are in `.env.example`.

---

## 🔌 Installing Plugins

Plugins add new commands to your bot. Anyone can share a plugin as a **GitHub Gist link** or any raw `.js` URL — you install it with one message, no coding involved.

### Install a plugin

Send this in any chat where your bot is active (owner only):

```
.install https://gist.githubusercontent.com/username/abc123/raw/myplugin.js
```

The bot downloads the plugin, loads it immediately, and tells you which new commands were added. No restart needed.

### Remove a plugin

```
.remove myplugin
```

Replace `myplugin` with the filename of the plugin you installed (without `.js`).

### Reload all plugins

```
.reloadplugins
```

Forces a fresh reload of every plugin — useful after editing a plugin file directly on the server.

---

### Where to get plugins

- **GitHub Gist** — [gist.github.com](https://gist.github.com) — anyone can share a plugin as a public gist. Copy the **Raw** link and use `.install`.
- **Raw GitHub files** — a direct link to any `.js` file on GitHub also works. Click the file → click **Raw** → copy the URL.
- **Community sharing** — plugin links shared in groups or by the bot's developer can be installed the same way.

> ⚠️ Only install plugins from people you trust. A plugin runs on your bot with full access.

---

### Creating your own plugin (for sharing via Gist)

Every plugin is a plain `.js` file. The only requirement is that it calls `bot()` at the bottom with a config and a handler. Here is the minimum structure — copy this, fill in the blanks, paste it into a new **public** Gist, and share the Raw link.

```js
const { bot } = require('../lib/pluginLoader');

bot({
  command: 'hello',           // the command users type (without the prefix)
  description: 'Say hello',  // shows up in .help
  category: 'fun',           // which menu section: fun, tools, general, ai, etc.
}, async (sock, chatId, message) => {

  await sock.sendMessage(chatId, { text: 'Hello! 👋' }, { quoted: message });

});
```

When installed, users trigger it with `.hello` (or whatever prefix the owner set).

**Multiple commands / aliases** — pass an array so the same plugin responds to more than one trigger:

```js
bot({
  command: ['hi', 'hey', 'hello'],
  description: 'Greet the bot',
  category: 'fun',
}, async (sock, chatId, message) => {
  await sock.sendMessage(chatId, { text: 'Hey there! 👋' }, { quoted: message });
});
```

**Reading what the user typed after the command** — use `query` (the full text) or `args` (each word as an array):

```js
bot({
  command: 'say',
  description: 'Make the bot repeat something',
  category: 'fun',
}, async (sock, chatId, message, args, query) => {
  if (!query) {
    return sock.sendMessage(chatId, { text: '❌ Example: .say hello world' }, { quoted: message });
  }
  await sock.sendMessage(chatId, { text: query }, { quoted: message });
});
```

**Available categories:** `ai` · `download` · `fun` · `games` · `general` · `group` · `nsfw` · `owner` · `photo` · `religion` · `text` · `tools`

**How to share via GitHub Gist:**
1. Go to [gist.github.com](https://gist.github.com)
2. Name your file `myplugin.js` (must end in `.js`)
3. Paste your plugin code
4. Click **Create public gist**
5. Click the **Raw** button — copy that URL
6. Send `.install <that url>` to your bot

---

### Updating the bot

Send `.update` to check for and apply the latest version from GitHub. Your session, data, and installed plugins are kept safe — only core files are updated.

---

## Requirements

| | Minimum |
|--|---------|
| Node.js | 20.x |
| npm | 10.x |
| FFmpeg | Required for media commands |
| WhatsApp | Active mobile account |

---

## Credits

| | |
|--|--|
| **DevKango** | [github.com/Dev-Kango](https://github.com/Dev-Kango) |
| **OfficialKango** | [github.com/OfficialKango](https://github.com/OfficialKango) |
| **Baileys** | [github.com/WhiskeySockets](https://github.com/WhiskeySockets) |

---

## Notice

> **Educational use only.** Do not use this bot for spam, harassment, or any illegal activity. WhatsApp may ban accounts that violate their Terms of Service.

---

<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=18&pause=1000&color=F94E8B&center=true&vCenter=true&width=500&lines=QUEEN+RIAM+MD;MADE+BY+HECTOR+MANUEL;THANKS+FOR+VISITING" alt="Typing SVG" />
  </a>
</p>

<p align="center">Made with love in Ghana by Hector Manuel</p>
