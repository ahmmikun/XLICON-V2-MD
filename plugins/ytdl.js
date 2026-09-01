const yts = require('yt-search');

module.exports = {
    name: 'ytmp3',
    description: 'Download YouTube audio (link or search)',
    aliases: ['ytdl', 'ytaudio', 'ytdlv3'],
    tags: ['downloader'],
    command: /^.?(ytmp3|ytdl|ytaudio|ytdlv3)/i,

    async execute(sock, m, args) {
        const chatId = m.key.remoteJid;
        const input = args.join(" ").trim();

        if (!input) {
            return m.reply("Usage:\n.ytmp3 <youtube link>\n.ytmp3 <search query>");
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🎵', key: m.key }
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
                `https://api-abztech.zone.id/download/ytmp3?url=${encodeURIComponent(finalUrl)}`;

            const apiRes = await fetch(apiUrl);
            const data = await apiRes.json();

            if (!apiRes.ok || !data?.status || !data?.download?.downloadUrl) {
                return m.reply(
                    `API Error: ${data?.message || "Failed to get audio URL."}`
                );
            }

            const title =
                data.download.title ||
                searchInfo?.title ||
                "YouTube Audio";

            const downloadUrl = data.download.downloadUrl;

            const audioRes = await fetch(downloadUrl);

            if (!audioRes.ok) {
                throw new Error(`Audio download failed: HTTP ${audioRes.status}`);
            }

            const arrayBuffer = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (!buffer.length) {
                throw new Error("Downloaded audio is empty");
            }

            const safeName = title
                .replace(/[\\/:*?"<>|]/g, "")
                .trim()
                .slice(0, 100) || "audio";

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
                    audio: buffer,
                    mimetype: "audio/mpeg",
                    fileName: `${safeName}.mp3`,
                    ptt: false
                },
                {
                    quoted: quotedMsg
                }
            );

        } catch (err) {
            console.error(
                'YTMP3 error:',
                err.response?.data || err.message
            );

            await m.reply(
                `❌ Failed to process request.\n\n${err.message || "Unknown error"}`
            );
        }
    }
};
