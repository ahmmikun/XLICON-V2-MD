const fetch = require('node-fetch');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
async function createSticker(img, url, packname = 'Bot', author = 'Bot') {
    let media = img;
    if (!media && url) {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid URL protocol');
        const h = parsed.hostname;
        if (/^(localhost|127\.|0\.0\.0\.0|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(h)) throw new Error('URL not allowed');
        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());
        media = await res.buffer();
    }

    const stickerPkg = new Sticker(media, {
        pack: packname,
        author: author,
        type: StickerTypes.DEFAULT,
        quality: 80,
    });

    return await stickerPkg.toBuffer();
}

module.exports = { createSticker };
