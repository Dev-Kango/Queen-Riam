const fs = require("fs");
const pathMod = require("path");
function _ugdPath(sock){const sid=sock&&sock._sessionNumber?sock._sessionNumber:null;return sid?"./data/userGroupData_"+sid+".json":"./data/userGroupData.json";}
function loadData(sock) {
    const p=_ugdPath(sock);
    if (!fs.existsSync(p)) return { welcome: {}, goodbye: {}, customMessages: {} };
    const d = JSON.parse(fs.readFileSync(p));
    if (!d.customMessages) d.customMessages = {};
    return d;
}
function saveData(data, sock) {
    fs.writeFileSync(_ugdPath(sock), JSON.stringify(data, null, 2));
}

async function handleWelcome(sock, chatId, message, matchText) {
    const data = loadData(sock);
    data.welcome = data.welcome || {};

    if (matchText === "on") {
        data.welcome[chatId] = { enabled: true };
        saveData(data, sock);
        await sock.sendMessage(chatId, { text: "✅ Welcome message enabled!" });
    } else if (matchText === "off") {
        delete data.welcome[chatId];
        saveData(data, sock);
        await sock.sendMessage(chatId, { text: "❌ Welcome message disabled!" });
    } else {
        await sock.sendMessage(chatId, { 
            text: "⚙️ Use:\n*.welcome on* → Enable welcome\n*.welcome off* → Disable welcome"
        });
    }
}

async function handleGoodbye(sock, chatId, message, matchText) {
    const data = loadData(sock);
    data.goodbye = data.goodbye || {};

    if (matchText === "on") {
        data.goodbye[chatId] = { enabled: true };
        saveData(data, sock);
        await sock.sendMessage(chatId, { text: "✅ Goodbye message enabled!" });
    } else if (matchText === "off") {
        delete data.goodbye[chatId];
        saveData(data, sock);
        await sock.sendMessage(chatId, { text: "❌ Goodbye message disabled!" });
    } else {
        await sock.sendMessage(chatId, { 
            text: "⚙️ Use:\n*.goodbye on* → Enable goodbye\n*.goodbye off* → Disable goodbye"
        });
    }
}

function isWelcomeOn(chatId, sock) {
    const data = loadData(sock);
    return data.welcome && data.welcome[chatId] && data.welcome[chatId].enabled;
}

function isGoodbyeOn(chatId, sock) {
    const data = loadData(sock);
    return data.goodbye && data.goodbye[chatId] && data.goodbye[chatId].enabled;
}

// ── Custom message helpers ──────────────────────────────────────────

function getCustomWelcome(groupId, sock) {
    const data = loadData(sock);
    return data.customMessages?.[groupId]?.welcome || null;
}

function getCustomGoodbye(groupId, sock) {
    const data = loadData(sock);
    return data.customMessages?.[groupId]?.goodbye || null;
}

function setCustomWelcome(groupId, text, sock) {
    const data = loadData(sock);
    if (!data.customMessages[groupId]) data.customMessages[groupId] = {};
    data.customMessages[groupId].welcome = text;
    saveData(data, sock);
}

function setCustomGoodbye(groupId, text, sock) {
    const data = loadData(sock);
    if (!data.customMessages[groupId]) data.customMessages[groupId] = {};
    data.customMessages[groupId].goodbye = text;
    saveData(data, sock);
}

function clearCustomWelcome(groupId, sock) {
    const data = loadData(sock);
    if (data.customMessages[groupId]) {
        delete data.customMessages[groupId].welcome;
        if (!Object.keys(data.customMessages[groupId]).length)
            delete data.customMessages[groupId];
    }
    saveData(data, sock);
}

function clearCustomGoodbye(groupId, sock) {
    const data = loadData(sock);
    if (data.customMessages[groupId]) {
        delete data.customMessages[groupId].goodbye;
        if (!Object.keys(data.customMessages[groupId]).length)
            delete data.customMessages[groupId];
    }
    saveData(data, sock);
}

// Replace placeholders in a custom message template
function applyPlaceholders(template, { userNumber, groupName, memberCount, time, date }) {
    return template
        .replace(/{user}/g, `@${userNumber}`)
        .replace(/{group}/g, groupName)
        .replace(/{count}/g, memberCount)
        .replace(/{time}/g, time)
        .replace(/{date}/g, date);
}

module.exports = {
    handleWelcome,
    handleGoodbye,
    isWelcomeOn,
    isGoodbyeOn,
    getCustomWelcome,
    getCustomGoodbye,
    setCustomWelcome,
    setCustomGoodbye,
    clearCustomWelcome,
    clearCustomGoodbye,
    applyPlaceholders
};
