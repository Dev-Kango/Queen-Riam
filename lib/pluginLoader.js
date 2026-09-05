'use strict';
const fs   = require('fs');
const path = require('path');
const { builtinModules } = require('module');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.join(__dirname, '..');
const DEPENDENCY_HEADER = /^\s*\/\/\s*@dependencies?\s*:\s*(.*?)\s*$/im;
const PACKAGE_NAME = /^(?:@[a-z0-9._~-]+\/[a-z0-9._~-]+|[a-z0-9._~-]+)$/i;
const BUILTIN_MODULES = new Set([
    ...builtinModules,
    ...builtinModules.map(name => 'node:' + name),
]);

// Global command registry
const pluginMap    = new Map();   // cmd -> { handler, meta }
const commandFiles = new Map();   // cmd -> filePath (for removal)
const eventHandlers = new Map();  // eventType -> [{ handler, meta }]

/**
 * Register a command — Levanter-style global function.
 * Plugin files call:  bot({ command, description, category }, handlerFn)
 */
function getRegistrationFile() {
    const stack = new Error().stack || '';
    for (const line of stack.split('\n').slice(1)) {
        const match = line.match(/(?:\(|\s)((?:file:\/\/)?[^()\s]+\/(?:plugins|eplugins)\/[^()\s:]+):\d+:\d+\)?/);
        if (match) return match[1].replace(/^file:\/\//, '');
    }
    return '';
}

function bot(config, handler) {
    if (typeof handler !== 'function') throw new Error('[pluginLoader] bot() requires a handler function');
    // Event handler registration
    if (config.on) {
        const eventType = config.on;
        if (!eventHandlers.has(eventType)) eventHandlers.set(eventType, []);
        eventHandlers.get(eventType).push({ handler, meta: config });
        return;
    }
    // Command registration
    const cmds = Array.isArray(config.command)
        ? config.command
        : [config.command].filter(Boolean);
    const registrationFile = getRegistrationFile();
    for (const cmd of cmds) {
        const key = cmd.toLowerCase();
        pluginMap.set(key, { handler, meta: config });
        if (registrationFile) commandFiles.set(key, registrationFile);
    }
}

// Make bot() a global so plugin files can optionally skip the require
global.bot = bot;

const PLUGIN_DIRS = [
    path.join(__dirname, '../plugins'),
    path.join(__dirname, '../eplugins'),
];

/** Load (or reload) all plugins from plugins/ and eplugins/ */
function loadPlugins() {
    pluginMap.clear();
    commandFiles.clear();
    eventHandlers.clear();
    let fileCount = 0;
    const pluginFiles = [];

    // Clear every top-level plugin cache before loading any plugin. A plugin may
    // be required by another plugin (for example sudo.js as a permission helper);
    // clearing caches one file at a time would execute that dependency twice.
    for (const dir of PLUGIN_DIRS) {
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); continue; }
        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.js') && !f.startsWith('_'));

        for (const file of files) {
            const fullPath = path.join(dir, file);
            pluginFiles.push({ file, fullPath });
            try {
                delete require.cache[require.resolve(fullPath)];
            } catch (_) {
                // The module may not have been loaded yet.
            }
        }
    }

    for (const { file, fullPath } of pluginFiles) {
        try {
            // Do not delete the cache here. If this file was already loaded as a
            // dependency, requiring it again must be a no-op.
            require(fullPath);
            fileCount++;
        } catch (err) {
            console.error('[plugins] Failed to load ' + file + ': ' + err.message);
        }
    }

    console.log('[plugins] Loaded ' + fileCount + ' file(s), ' + pluginMap.size + ' command(s) registered');
    return pluginMap;
}

/**
 * Dynamically install a plugin from an already-written file path.
 * Returns array of newly registered command names.
 */
function installPlugin(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        const before = new Set(pluginMap.keys());
        require(filePath);
        const added = [];
        for (const key of pluginMap.keys()) {
            if (!before.has(key)) {
                commandFiles.set(key, filePath);
                added.push(key);
            }
        }
        return added;
    } catch (err) {
        throw new Error('Failed to install plugin: ' + err.message);
    }
}

/**
 * Read dependencies from a single-file plugin. The header is optional because
 * ordinary require()/import statements are detected automatically.
 *
 * Supported format:
 *   // @dependencies: axios@^1.8.0, cheerio@^1.0.0
 */
function getPluginDependencies(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const match = source.match(DEPENDENCY_HEADER);
    const dependencies = [];

    if (match && match[1].trim()) {
        const declared = match[1]
            .split(',')
            .map(spec => spec.trim())
            .filter(Boolean);

        for (const spec of declared) {
            const packageName = dependencyPackageName(spec);
            if (!PACKAGE_NAME.test(packageName) || spec.startsWith('-') || /[;&|`$]/.test(spec)) {
                throw new Error('Invalid dependency declaration: ' + spec);
            }
            dependencies.push(spec);
        }
    }

    // Also detect ordinary static imports so most plugins need no metadata at all.
    const importPatterns = [
        /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bfrom\s*['"]([^'"]+)['"]/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
    for (const pattern of importPatterns) {
        for (const importMatch of source.matchAll(pattern)) {
            const candidate = importMatch[1];
            const packageName = dependencyPackageName(candidate);
            if (
                !candidate.startsWith('.') &&
                !candidate.startsWith('/') &&
                !BUILTIN_MODULES.has(candidate) &&
                PACKAGE_NAME.test(packageName)
            ) {
                dependencies.push(packageName);
            }
        }
    }

    return [...new Set(dependencies)];
}

function dependencyPackageName(spec) {
    let packageName = spec;
    if (packageName[0] === '@') {
        const atIndex = packageName.indexOf('@', packageName.indexOf('/') + 1);
        if (atIndex > 0) packageName = packageName.slice(0, atIndex);
        return packageName.split('/').slice(0, 2).join('/');
    }
    const atIndex = packageName.indexOf('@');
    if (atIndex > 0) packageName = packageName.slice(0, atIndex);
    return packageName.split('/')[0];
}

/**
 * Return dependency specs whose package is not already resolvable by Queen Riam.
 * Installed packages are deliberately reused, regardless of the requested range.
 */
function getMissingDependencies(dependencies) {
    return dependencies.filter(spec => {
        try {
            require.resolve(dependencyPackageName(spec), { paths: [PROJECT_ROOT] });
            return false;
        } catch (_) {
            return true;
        }
    });
}

/**
 * Install only dependencies that are still missing from the project.
 * execFile is used instead of a shell so dependency text cannot become shell code.
 */
async function installMissingDependencies(dependencies) {
    const missing = getMissingDependencies(dependencies);
    if (!missing.length) return [];

    try {
        await execFileAsync('npm', ['install', '--no-save', ...missing], {
            cwd: PROJECT_ROOT,
            timeout: 5 * 60 * 1000,
            maxBuffer: 2 * 1024 * 1024,
        });
    } catch (err) {
        const detail = err.stderr?.trim() || err.message;
        throw new Error('Package installation failed: ' + detail);
    }

    const stillMissing = getMissingDependencies(dependencies);
    if (stillMissing.length) {
        throw new Error('Packages still unavailable after installation: ' + stillMissing.join(', '));
    }
    return missing;
}

/**
 * Remove a plugin by command name.
 * Unregisters all commands from the same file, deletes from eplugins/ if applicable.
 * Returns true if found and removed, false if not found.
 */
function removePlugin(commandName) {
    const filePath = commandFiles.get(commandName.toLowerCase());
    if (!filePath) return false;
    // Unregister every command belonging to this file
    for (const [cmd, fp] of commandFiles.entries()) {
        if (fp === filePath) {
            pluginMap.delete(cmd);
            commandFiles.delete(cmd);
        }
    }
    // Delete file only from eplugins/
    if (filePath.includes('eplugins') && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return true;
}

/**
 * Download a plugin JS file from a URL and save it to eplugins/.
 * Returns the saved file path.
 */
async function downloadPlugin(url, filename) {
    const fetch  = require('node-fetch');
    const dir    = path.join(__dirname, '../eplugins');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' - ' + res.statusText);

    const code     = await res.text();
    const saveName = filename || path.basename(url.split('?')[0]) || 'plugin.js';
    const outPath  = path.join(dir, saveName.endsWith('.js') ? saveName : saveName + '.js');
    fs.writeFileSync(outPath, code, 'utf8');
    return outPath;
}

/** List all registered commands with metadata */
function getPlugins() {
    return Array.from(pluginMap.entries()).map(([cmd, data]) => ({
        command:     cmd,
        description: data.meta?.description || '',
        category:    data.meta?.category    || 'general',
        hidden:      data.meta?.hidden      || false,
        file:        commandFiles.get(cmd)  || '',
    }));
}


/**
 * Dispatch an event to all registered on: handlers for that type.
 * ctx is a plain object with relevant fields for that event.
 */
async function dispatchEvent(eventType, ctx) {
    const handlers = eventHandlers.get(eventType);
    if (!handlers || !handlers.length) return;
    for (const { handler } of handlers) {
        try {
            await handler(ctx);
        } catch (err) {
            console.error('[event:' + eventType + '] handler error:', err.message);
        }
    }
}


/**
 * Load external plugins listed in eplugins-registry.json on startup.
 * Registry format: { "plugins": [{ "name": "vv", "url": "https://gist.github.com/user/id" }] }
 * Gist URLs are auto-converted to raw URLs.
 */
async function loadExternalPlugins() {
    const registryPath = path.join(__dirname, '../eplugins-registry.json');
    if (!fs.existsSync(registryPath)) {
        console.log('[eplugins] No registry file found, skipping external plugins');
        return;
    }

    let registry;
    try {
        registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch (err) {
        console.error('[eplugins] Failed to parse registry:', err.message);
        return;
    }

    const plugins = registry.plugins || [];
    if (!plugins.length) {
        console.log('[eplugins] Registry is empty, no external plugins to load');
        return;
    }

    console.log('[eplugins] Loading ' + plugins.length + ' external plugin(s) from registry...');
    let loaded = 0;
    let failed = 0;

    for (const entry of plugins) {
        if (!entry.name || !entry.url) {
            console.warn('[eplugins] Skipping invalid entry:', JSON.stringify(entry));
            continue;
        }

        // Convert gist page URL to raw URL
        let rawUrl = entry.url.trim();
        if (rawUrl.includes('gist.github.com') && !rawUrl.includes('raw')) {
            // https://gist.github.com/user/id  →  https://gist.githubusercontent.com/user/id/raw/
            rawUrl = rawUrl.replace('gist.github.com', 'gist.githubusercontent.com').replace(/\/?$/, '/raw/');
        }

        try {
            const filePath = await downloadPlugin(rawUrl, entry.name + '.js');
            const dependencies = getPluginDependencies(filePath);
            const missing = getMissingDependencies(dependencies);
            if (missing.length) {
                throw new Error('Missing dependencies: ' + missing.join(', ') + '. Install them and reload the plugin.');
            }
            const added = installPlugin(filePath);
            console.log('[eplugins] ✅ ' + entry.name + ' installed (' + added.join(', ') + ')');
            loaded++;
        } catch (err) {
            console.error('[eplugins] ❌ Failed to load ' + entry.name + ': ' + err.message);
            failed++;
        }
    }

    console.log('[eplugins] Done — ' + loaded + ' loaded, ' + failed + ' failed');
}

module.exports = {
    pluginMap,
    loadPlugins,
    installPlugin,
    removePlugin,
    downloadPlugin,
    getPluginDependencies,
    getMissingDependencies,
    installMissingDependencies,
    getPlugins,
    loadExternalPlugins,
    dispatchEvent,
    bot,
};
