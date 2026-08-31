const axios = require('axios');

module.exports = {
    name: 'xlicon',
    description: 'Auto reply audio when xlicon is detected',

    async execute() {},

    async onMessage(sock, m) {
        if (!m.text) return;

        const text = m.text.trim().toLowerCase();

        if (text !== 'xlicon') return;

        try {
            const prefix = global.BOT_PREFIX || '.';

            await m.reply(
                `ɪꜰ ʏᴏᴜ ɴᴇᴇᴅ ʜᴇʟᴘ, ᴛʏᴘᴇ ${prefix}ᴍᴇɴᴜ`
            );

            const audioUrl = 'https://files.catbox.moe/tcz5xk.mp3';

            const response = await axios.get(audioUrl, {
                responseType: 'arraybuffer'
            });

            const audio = Buffer.from(response.data);

            await sock.sendMessage(m.from, {
                audio,
                mimetype: 'audio/mpeg',
                ptt: false
            });

        } catch (err) {
            console.error('❌ Xlicon error:', err);
        }
    }
};
