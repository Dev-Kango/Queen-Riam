const { bot } = require('../lib/pluginLoader');

const fs   = require('fs');
const path = require('path');

bot({
  command: ['vcf'],
  description: 'Export group contacts as VCF',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) { await sock.sendMessage(chatId, { text: 'Groups only!' }); return; }
  const gMeta = await sock.groupMetadata(chatId);
  const isGAdmin = gMeta.participants.filter(p => p.admin).map(p => p.id).includes(ctx.senderId);
  if (!isGAdmin) { await sock.sendMessage(chatId, { text: '❌ Admins only!' }); return; }
  await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
  let vcard = '', counter = 1;
  for (const member of gMeta.participants) {
    let num = null;
    if (member.id?.endsWith('@s.whatsapp.net')) num = member.id.split('@')[0].split(':')[0];
    else if (member.phoneNumber) num = member.phoneNumber.split('@')[0].split(':')[0];
    if (!num || !/^\d+$/.test(num)) continue;
    vcard += 'BEGIN:VCARD\nVERSION:3.0\nFN:Riam ' + counter++ + '\nTEL;type=CELL;type=VOICE;waid=' + num + ':+' + num + '\nEND:VCARD\n';
  }
  if (!vcard.trim()) {
    await sock.sendMessage(chatId, { text: '❌ Could not extract any phone numbers.' });
    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    return;
  }
  const fname = 'Contacts_' + gMeta.subject.replace(/\s+/g, '_') + '.vcf';
  const fpath = path.join(process.cwd(), fname);
  fs.writeFileSync(fpath, vcard.trim());
  await sock.sendMessage(chatId, {
    document: fs.readFileSync(fpath),
    mimetype: 'text/vcard',
    fileName: fname,
    caption: 'Contacts for *' + gMeta.subject + '*\n\n©QUEEN RIAM'
  });
  fs.unlinkSync(fpath);
  await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
});
