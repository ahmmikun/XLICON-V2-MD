const axios = require('axios');

module.exports = {
    name: 'ping',
    aliases: ['speed', 'latency'],
    description: 'Check bot response speed',

    async execute(sock, m, args) {
        
            await m.react('⏱️');
        const start = Date.now();
        const sentMsg = await m.reply('Pinging...');
        const latency = Date.now() - start;
        const info = `> Latency: ${latency} ms`;

        try {
            await sock.sendMessage(m.from, {
                text: info,
                edit: sentMsg.key
            });
        } catch (err) {
            console.error('Ping error:', err);
            await sock.sendMessage(m.from, {
                text: `Latency: ${latency} ms`,
                edit: sentMsg.key
            });
        }
    }
};
