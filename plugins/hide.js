module.exports = {
    name: 'readmore',
    description: 'Create WhatsApp read more messages',
    aliases: ['hide', 'readmore'],
    tags: ['other'],

    command: /^(?:\.|\/|!)?\s*(?:hide|read\s*more)/i,

    async execute(sock, m) {
        try {
            await m.react('🤫');

            const messageText = m.body || m.text || '';

            const q = messageText
                .replace(/^(?:\.|\/|!)?\s*(?:hide|read\s*more)\s*/i, '')
                .trim();

            if (!q) {
                return await sock.sendMessage(m.from, {
                    text: '*Example:* `.hide Good morning 🌞`'
                });
            }

            let output = q;

            if (q.includes(',')) {
                const parts = q.split(',');
                const title = parts.shift().trim();
                const hiddenText = parts.join(',').trim();

                output = `${title}\n\n${'\u200e'.repeat(4001)}${hiddenText}`;
            } else {
                output = `\u200e${q}`;
                output = '\u200e'.repeat(4001) + q;
            }

            await sock.sendMessage(m.from, {
                text: output
            });

        } catch (err) {
            console.error('❌ XLICON V2 ReadMore Error:', err);

            await sock.sendMessage(m.from, {
                text: `Error: ${err.message || 'Failed to create read more message.'}`
            });
        }
    }
};
