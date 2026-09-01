const yts = require('yt-search');

module.exports = {
    name: 'ymp4',
    description: 'Download YouTube video as MP4 (link or search)',
    aliases: ['ytmp4', 'ytvideo'],
    tags: ['downloader'],
    command: /^.?(ymp4|ytmp4|ytvideo)/i,

    async execute(sock, m, args) {
        const chatId = m.key.remoteJid;
        const input = args.join(" ").trim();

        if (!input) {
            return m.reply("Usage:\n.ymp4 <youtube link or search query>");
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🎬', key: m.key }
            });

            let finalUrl = input;
            let searchInfo = null;

            if (!input.includes("youtube.com") && !input.includes("youtu.be")) {
                const results = await yts(input);

                if (!results?.videos?.length) {
                    return m.reply("No results found on YouTube.");
                }

                searchInfo = results.videos[0];
                finalUrl = searchInfo.url;
            }

            const apiUrl =
                `https://api-abztech.zone.id/download/ytdlvip?url=${encodeURIComponent(finalUrl)}&format=720`;

            const apiRes = await fetch(apiUrl);
            const data = await apiRes.json();

            if (!apiRes.ok || !data?.status || !data?.data?.download_url) {
                return m.reply(
                    `API Error: ${data?.message || "Failed to get download URL."}`
                );
            }

            const title =
                data.data.title ||
                searchInfo?.title ||
                "YouTube Video";

            const downloadUrl = data.data.download_url;

            const videoRes = await fetch(downloadUrl);

            if (!videoRes.ok) {
                throw new Error(
                    `Download failed: HTTP ${videoRes.status}`
                );
            }

            const arrayBuffer = await videoRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (!buffer.length) {
                throw new Error("Downloaded video is empty");
            }

            const safeName = title
                .replace(/[\\/:*?"<>|]/g, "")
                .trim()
                .slice(0, 100) || "video";

            const quotedMsg = m.quoted || {
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: m.id,
                    participant: m.sender
                },
                message: {
                    extendedTextMessage: {
                        text: m.body
                    }
                }
            };

            await sock.sendMessage(
                chatId,
                {
                    video: buffer,
                    mimetype: "video/mp4",
                    fileName: `${safeName}.mp4`,
                    caption: title,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363230794474148@newsletter',
                            newsletterName: '𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                            serverMessageId: 1
                        }
                    }
                },
                {
                    quoted: quotedMsg
                }
            );

        } catch (err) {
            console.error(
                'YMP4 error:',
                err.message
            );

            await m.reply(
                `❌ Failed to process request.\n\n${err.message || "Unknown error"}`
            );
        }
    }
};
