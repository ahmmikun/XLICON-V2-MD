module.exports = {
    name: 'poll',
    description: 'Create a WhatsApp poll',
    aliases: [],
    tags: ['main'],
    command: /^(poll)$/i,

    async execute(sock, m, args) {
        try {
             // reat emoji for this cmd
            await m.react('🗳️');
            if (!args || args.length === 0) {
                return await m.reply("Usage: .poll PollName;Option1;Option2;Option3");
            }

            const data = args.join(" ");
            const parts = data.split(";").map(x => x.trim());

            const pollName = parts.shift();
            if (!pollName || parts.length < 2) {
                return await m.reply("Need a poll name and at least 2 options!");
            }

            const pollMessage = {
                poll: {
                    name: pollName,
                    values: parts,
                    selectableCount: 1,
                },
            };

            await sock.sendMessage(m.from, pollMessage);
            await m.react("✔");
        } catch (err) {
            console.error(" Poll plugin error:", err);
            await m.reply(" Failed to create poll.");
        }
    },
};
