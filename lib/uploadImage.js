const axios = require('axios');
const FormData = require('form-data');
const FileType = require('file-type');

async function uploadToCatbox(buffer, ext) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', '');
    form.append('fileToUpload', buffer, `upload.${ext}`);
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 30000,
    });
    if (typeof res.data !== 'string' || !res.data.startsWith('https://')) {
        throw new Error('Catbox upload failed');
    }
    return res.data;
}

async function uploadToTelegraph(buffer, ext, mime) {
    const form = new FormData();
    form.append('file', buffer, { filename: `upload.${ext}`, contentType: mime });
    const res = await axios.post('https://telegra.ph/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000,
    });
    if (res.data?.[0]?.src) {
        return 'https://telegra.ph' + res.data[0].src;
    }
    throw new Error('Telegraph upload failed');
}

async function uploadImage(buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error('Invalid buffer');
    }
    if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('File exceeds 10MB limit');
    }
    const type = await FileType.fromBuffer(buffer);
    const ext = type?.ext || 'png';
    const mime = type?.mime || 'image/png';

    try {
        return await uploadToCatbox(buffer, ext);
    } catch (err) {
        console.warn('[UPLOAD] Catbox failed, trying Telegraph:', err.message);
    }
    try {
        return await uploadToTelegraph(buffer, ext, mime);
    } catch (err) {
        console.error('[UPLOAD] Both services failed:', err.message);
        throw new Error('Failed to upload image to both Catbox and Telegraph');
    }
}

module.exports = { uploadImage, uploadToCatbox, uploadToTelegraph };
