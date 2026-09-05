const { bot } = require('../lib/pluginLoader');
const { hasOwnerPrivileges } = require('./sudo');


bot({
  command: ['update'],
  description: 'Update bot to latest version from GitHub',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) { await sock.sendMessage(chatId, { text: '❌ Owner only!' }); return; }
  const AdmZip = require('adm-zip');
  const os     = require('os');
  const path   = require('path');
  const fs     = require('fs');
  const axios  = require('axios');
  const RAW_PKG_URL = 'https://raw.githubusercontent.com/Dev-Kango/Queen-Riam/main/package.json';
  const updateURL   = 'https://github.com/Dev-Kango/Queen-Riam/archive/refs/heads/main.zip';
  const tmpDir  = path.join(os.tmpdir(), 'bot_update_' + Date.now());
  const zipPath = path.join(tmpDir, 'update.zip');
  try {
    await sock.sendMessage(chatId, { text: '🔍 Checking for updates...' });
    const localVersion  = require('../package.json').version;
    const remotePkgRes  = await axios.get(RAW_PKG_URL, { timeout: 10000 });
    const remoteVersion = remotePkgRes.data?.version;
    if (!remoteVersion) throw new Error('Could not read remote version.');
    if (localVersion === remoteVersion) {
      await sock.sendMessage(chatId, { text: '✅ *Bot is already up to date!*\n\n📦 Current version: *v' + localVersion + '*\n\nNo updates available.' });
      return;
    }
    await sock.sendMessage(chatId, { text: '🆕 *Update available!*\n\n📦 Current: *v' + localVersion + '*\n🚀 New: *v' + remoteVersion + '*\n\n⏬ Downloading...' });
    fs.mkdirSync(tmpDir, { recursive: true });
    const res = await axios({ url: updateURL, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(zipPath);
    res.data.pipe(writer);
    await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
    await sock.sendMessage(chatId, { text: '📦 Extracting...' });
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tmpDir, true);
    const folders = fs.readdirSync(tmpDir).filter(f => fs.lstatSync(path.join(tmpDir, f)).isDirectory());
    const root = path.join(tmpDir, folders.find(f => f.includes('Queen-Riam')) || folders[0]);
    const SKIP_FILES = ['settings.js', '.env', 'creds.json', 'package-lock.json', 'eplugins-registry.json'];
    const SKIP_DIRS  = ['data', 'session', 'node_modules', 'eplugins'];
    let updated = 0, skipped = 0;
    const copy = (src, dest) => {
      for (const item of fs.readdirSync(src)) {
        const sp = path.join(src, item), dp = path.join(dest, item);
        if (fs.statSync(sp).isDirectory()) {
          if (SKIP_DIRS.includes(item)) { skipped++; continue; }
          if (!fs.existsSync(dp)) fs.mkdirSync(dp);
          copy(sp, dp);
        } else {
          if (SKIP_FILES.includes(item)) { skipped++; continue; }
          fs.copyFileSync(sp, dp); updated++;
        }
      }
    };
    copy(root, path.join(__dirname, '..'));

    // ── Merge eplugins-registry.json instead of overwriting it ──────────────
    // Official entries (matched by "name") get added/updated with the latest
    // URL from the repo. Any entries a self-hoster added on their own (name
    // not present upstream) are left untouched instead of being wiped out.
    try {
      const localRegistryPath  = path.join(__dirname, '..', 'eplugins-registry.json');
      const remoteRegistryPath = path.join(root, 'eplugins-registry.json');
      if (fs.existsSync(remoteRegistryPath)) {
        const remoteRegistry = JSON.parse(fs.readFileSync(remoteRegistryPath, 'utf8'));
        const remotePlugins  = remoteRegistry.plugins || [];
        let localPlugins = [];
        if (fs.existsSync(localRegistryPath)) {
          try { localPlugins = JSON.parse(fs.readFileSync(localRegistryPath, 'utf8')).plugins || []; } catch (_) {}
        }
        const merged = [...localPlugins];
        for (const remoteEntry of remotePlugins) {
          const idx = merged.findIndex(p => p.name === remoteEntry.name);
          if (idx >= 0) merged[idx] = remoteEntry;
          else merged.push(remoteEntry);
        }
        fs.writeFileSync(localRegistryPath, JSON.stringify({ plugins: merged }, null, 2));
      }
    } catch (regErr) {
      console.error('[update] Failed to merge eplugins-registry.json:', regErr.message);
    }

    await sock.sendMessage(chatId, { text: '✅ *Updated to v' + remoteVersion + '!*\n\n📝 ' + updated + ' files updated, ' + skipped + ' skipped.\n\n🔄 Restarting...' });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    setTimeout(() => process.exit(0), 2500);
  } catch (err) {
    await sock.sendMessage(chatId, { text: '❌ Update failed: ' + err.message });
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
