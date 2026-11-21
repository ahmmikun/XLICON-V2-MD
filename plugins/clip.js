
module.exports = {
    name: 'clip',
    description: 'Search and send Vlipsy video clips',
    aliases: ['vlipsy', 'clips'],
    tags: ['media'],
    command: /^\.?(clip|vlipsy|clips)\b/i,

    async execute(sock, m, args) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return m.reply(
                'Usage:\n.clip <search query>\n\nExample:\n.clip nice'
            );
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🎬', key: m.key }
            });

            await m.reply(`🔎 Searching clips for: ${query}`);

            const apiUrl =
                'https://api-abztech.apps.mistral.run/search/vlipsy?q=' +
                encodeURIComponent(query);

            const apiRes = await fetch(apiUrl);
            const data = await apiRes.json();

            if (!apiRes.ok || !data?.status) {
                throw new Error(
                    data?.message || 'Failed to search clips.'
                );
            }

            const results = data.results || [];

            if (!results.length) {
                return m.reply('❌ No clips found for that search.');
            }

            const clip = results[
                Math.floor(Math.random() * results.length)
            ];

            const videoUrl =
                clip.media?.video_hd ||
                clip.media?.video;

            if (!videoUrl) {
                throw new Error('No video URL found.');
            }

            const videoRes = await fetch(videoUrl);

            if (!videoRes.ok) {
                throw new Error(
                    `Video download failed: HTTP ${videoRes.status}`
                );
            }

            const MAX_SIZE = 64 * 1024 * 1024;

            const contentLength = Number(
                videoRes.headers.get('content-length')
            );

            if (contentLength > MAX_SIZE) {
                await videoRes.body?.cancel();
                return m.reply('❌ Clip exceeds 64 MB.');
            }

            const chunks = [];
            let totalSize = 0;

            for await (const chunk of videoRes.body) {
                totalSize += chunk.length;

                if (totalSize > MAX_SIZE) {
                    await videoRes.body?.cancel();
                    return m.reply('❌ Clip exceeds 64 MB.');
                }

                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer.length) {
                throw new Error('Downloaded clip is empty.');
            }

            await sock.sendMessage(
                chatId,
                {
                    video: buffer,
                    mimetype: 'video/mp4',
                    fileName: 'abztech-clip.mp4',
                    caption:
                        `🎬 ${clip.title || 'Vlipsy Clip'}\n\n` +
                        ` Search: ${query}\n` +
                        ` Duration: ${Number(clip.duration || 0).toFixed(2)} seconds\n` +
                        ` Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB\n\n` +
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
            console.error('CLIP ERROR:', err);

            await m.reply(
                `❌ Clip search failed.\n\n${err.message || 'Unknown error'}`
            );
        }
    }
};
