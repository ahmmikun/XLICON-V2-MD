const axios = require('axios');
const sharp = require('sharp');
const yts = require('yt-search');

module.exports = {
name: 'play',
description: 'Search YouTube and choose MP3 or MP4 to download',
aliases: ['yt', 'song'],
command: /^.?(play|yt|song)/i,

async execute(sock, m, args) {
     // reat emoji for this cmd
            await m.react('🎧');
    const prefix = global.BOT_PREFIX || '.';
    const chatId = m.key.remoteJid;
    const query = args.join(" ").trim();

    if (!query) {
        return m.reply(`Usage:\n${prefix}play <youtube link or search query>`);
    }

    try {
        await sock.sendMessage(chatId, {
            react: { text: '🎵', key: m.key }
        });

        let finalUrl = query;
        let title = "YouTube Video";
        let thumbUrl = null;

        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const results = await yts(query);

            if (!results || !results.videos || results.videos.length === 0) {
                return m.reply("No results found on YouTube.");
            }

            finalUrl = results.videos[0].url;
            title = results.videos[0].title;
            thumbUrl = results.videos[0].thumbnail;
        } else {
            const results = await yts(query);
            if (results && results.videos && results.videos.length > 0) {
                title = results.videos[0].title;
                thumbUrl = results.videos[0].thumbnail;
            }
        }

        let thumb;
        try {
            const { data } = await axios.get(thumbUrl, { responseType: 'arraybuffer' });
            thumb = await sharp(Buffer.from(data))
                .resize(120, 120, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
                .jpeg({ quality: 85 })
                .toBuffer();
        } catch {
            thumb = null;
        }

        await sock.relayMessage(
            chatId,
            {
                buttonsMessage: {
                    text: `🎬 *${title}*\n\nChoose a format to download:`,
                    contentText: `🎬 *${title}*\n\nChoose a format to download:`,
                    footerText: '「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                    locationMessage: {
                        name: title,
                        address: "YouTube Download",
                        jpegThumbnail: thumb
                    },
                    buttons: [
                        {
                            buttonId: `${prefix}ytmp3 ${finalUrl}`,
                            buttonText: { displayText: 'MP3' },
                            type: 1
                        },
                        {
                            buttonId: `${prefix}ymp4 ${finalUrl}`,
                            buttonText: { displayText: 'MP4' },
                            type: 1
                        }
                    ],
                    headerType: 6
                }
            },
            {
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: {},
                        content: [
                            {
                                tag: 'interactive',
                                attrs: { type: 'native_flow', v: '1' },
                                content: [
                                    { tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }
                                ]
                            }
                        ]
                    }
                ]
            }
        );

    } catch (err) {
        console.error('Play error:', err);
        m.reply('Failed to process request.');
    }
}

};
