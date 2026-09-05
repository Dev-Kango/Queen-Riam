// Legacy compatibility stub. Fake vCards are intentionally disabled.
async function initFakeVcard() {}
function getFakeVcard() { return null; }
module.exports = getFakeVcard;
module.exports.initFakeVcard = initFakeVcard;
