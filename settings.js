// Queen Riam - Settings
// All values are read from environment variables.
// Copy .env.example to .env and fill in your details,
// OR set them as environment variables on your hosting platform.

require('dotenv').config({ override: true });

const settings = {
  // ── Bot Identity ─────────────────────────────────────────────────────────
  botName:     process.env.BOT_NAME     || 'BROCODE_GHOST_BOT',
  botOwner:    process.env.BOT_OWNER    || 'BROCODE',
  packname:    process.env.PACK_NAME    || 'BROCODE',
  author:      process.env.PACK_AUTHOR  || 'Hector Manuel',
  description: 'This is a bot for managing group commands and automating tasks.',
  version:     '1.0.0',

  // ── Owner & Session ──────────────────────────────────────────────────────
  // ownerNumber: your WhatsApp number with country code, no + or spaces
  // SESSION_ID:  set on your platform — format is RIAM~<base64> or Queen~<megaId>
  ownerNumber: (process.env.OWNER_NUMBER || '254106852793').replace(/[^0-9]/g, ''),

  // ── Behaviour ────────────────────────────────────────────────────────────
  prefix:      process.env.PREFIX       || '.',
  timezone:    process.env.TIMEZONE     || 'Africa/Accra',
  commandMode: process.env.COMMAND_MODE || 'public',   // 'public' or 'private'

  // ── Auto Features ────────────────────────────────────────────────────────
  AUTO_STATUS_REACT:  process.env.AUTO_STATUS_REACT  || 'true',
  AUTO_STATUS_REPLY:  process.env.AUTO_STATUS_REPLY  || 'true',
  AUTO_STATUS_MSG:    process.env.AUTO_STATUS_MSG     || 'Status Viewed BROCODE',
  AUTOREAD:           process.env.AUTOREAD            || 'true',
  AUTOTYPE:           process.env.AUTOTYPE            || 'true',
  AUTORECORD:         process.env.AUTORECORD          || 'true',
  AUTORECORDTYPE:     process.env.AUTORECORDTYPE      || 'true',

  // ── API Keys ─────────────────────────────────────────────────────────────
  giphyApiKey: process.env.GIPHY_API_KEY || '',
};

module.exports = settings;
