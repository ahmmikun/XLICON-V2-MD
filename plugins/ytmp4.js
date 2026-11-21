
const yts = require('yt-search');

let lastQuality = 720;

module.exports = {
    name: 'ymp4',
    description: 'Download YouTube video as MP4 (link or search)',
    aliases: ['ytmp4', 'ytvideo'],
    tags: ['downloader'],
    command: /^\.?(ymp4|ytmp4|ytvideo)\b/i,

    async execute(sock, m, args) {
        const chatId = m.key.remoteJid;
        const input = args.join(' ').trim();

        if (!input) {
            return m.reply(
                'Usage:\n.ymp4 <YouTube link or search query>'
            );
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🎬', key: m.key }
            });

            let finalUrl = input;
            let searchInfo = null;

            if (!/^https?:\/\//i.test(input)) {
                const results = await yts(input);

                if (!results?.videos?.length) {
                    return m.reply('❌ No YouTube results found.');
                }

                searchInfo = results.videos[0];
                finalUrl = searchInfo.url;
            }

            const apiUrl =
                'https://api-abztech.apps.mistral.run/download/ytdl?url=' +
                encodeURIComponent(finalUrl);

            const apiRes = await fetch(apiUrl);
            const data = await apiRes.json();

            if (!apiRes.ok || !data?.status) {
                return m.reply(
                    `❌ API Error: ${data?.message || 'Failed to get video.'}`
                );
            }

            const title =
                data.title || searchInfo?.title || 'YouTube Video';

            const duration = data.duration || 'Unknown';
            const MAX_SIZE = 64 * 1024 * 1024;

            const videos = [
                ...(Array.isArray(data.video) ? data.video : [])
            ];

            if (data.downloadUrl) {
                videos.push({
                    quality: data.quality || '720p',
                    url: data.downloadUrl
                });
            }

            const uniqueVideos = [
                ...new Map(
                    videos
                        .filter(v => v?.url)
                        .map(v => [v.url, v])
                ).values()
            ];

            if (!uniqueVideos.length) {
                return m.reply('❌ No MP4 format found.');
            }

            lastQuality = lastQuality === 480 ? 720 : 480;

            const selected =
                uniqueVideos.find(v =>
                    Number(v.quality?.match(/\d+/)?.[0]) === lastQuality
                ) ||
                uniqueVideos.find(v =>
                    Number(v.quality?.match(/\d+/)?.[0]) === 720
                ) ||
                uniqueVideos[0];

            const quality = selected.quality || 'Unknown';

            await m.reply(
                `⏳ Downloading video...\n\n` +
                `🎬 ${title}\n` +
                `📺 Quality: ${quality}\n` +
                `⏱️ Duration: ${duration}`
            );

            const videoRes = await fetch(selected.url);

            if (!videoRes.ok) {
                throw new Error(
                    `Download failed: HTTP ${videoRes.status}`
                );
            }

            const contentLength = Number(
                videoRes.headers.get('content-length')
            );

            if (contentLength > MAX_SIZE) {
                await videoRes.body?.cancel();
                return m.reply(
                    '❌ Video exceeds 64 MB. Download cancelled.'
                );
            }

            const chunks = [];
            let totalSize = 0;

            for await (const chunk of videoRes.body) {
                totalSize += chunk.length;

                if (totalSize > MAX_SIZE) {
                    await videoRes.body?.cancel();
                    return m.reply(
                        '❌ Video exceeds 64 MB. Download cancelled.'
                    );
                }

                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer.length) {
                throw new Error('Downloaded video is empty.');
            }

            const safeName = title
                .replace(/[\\/:*?"<>|]/g, '')
                .trim()
                .slice(0, 100) || 'video';

            await sock.sendMessage(
                chatId,
                {
                    video: buffer,
                    mimetype: 'video/mp4',
                    fileName: `${safeName}.mp4`,
                    caption:
                        `🎬 ${title}\n\n` +
                        `📺 Quality: ${quality}\n` +
                        `⏱️ Duration: ${duration}\n` +
                        `📦 Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB\n\n` +
                        `ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ XLICON V2`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363230794474148@newsletter',
                            newsletterName:
                                '𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙦𝙨𝙨 」',
                            serverMessageId: 1
                        }
                    }
                },
                m.quoted ? { quoted: m.quoted } : {}
            );

            await sock.sendMessage(chatId, {
                react: { text: '✅', key: m.key }
            });

        } catch (err) {
            console.error('YMP4 error:', err);

            await m.reply(
                `❌ Download failed.\n\n${err.message || 'Unknown error'}`
            );
        }
    }
};
