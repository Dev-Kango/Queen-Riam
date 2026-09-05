const fs = require('fs');
const path = require('path');

function _alFile(sessionId){return sessionId?path.join(__dirname,'../data/antilinkSettings_'+sessionId+'.json'):path.join(__dirname,'../data/antilinkSettings.json');}
function loadAntilinkSettings(sessionId) {
    const f=_alFile(sessionId);
    if (fs.existsSync(f)) { const data = fs.readFileSync(f); return JSON.parse(data); }
    return {};
}
function saveAntilinkSettings(settings, sessionId) {
    fs.writeFileSync(_alFile(sessionId), JSON.stringify(settings, null, 2));
}
function setAntilinkSetting(groupId, type, sessionId) {
    const settings = loadAntilinkSettings(sessionId);
    settings[groupId] = type;
    saveAntilinkSettings(settings, sessionId);
}
function getAntilinkSetting(groupId, sessionId) {
    const settings = loadAntilinkSettings(sessionId);
    return settings[groupId] || 'off';
}

module.exports = {
    setAntilinkSetting,
    getAntilinkSetting
};
