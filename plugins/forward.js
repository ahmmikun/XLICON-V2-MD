module.exports = {
    name: "forward",
    aliases: ["fwd", "fw"],

    async execute(sock, m, args) {
        try {
            // reat emoji for this cmd
            await m.react('➡️');
            if (!m.quoted) {
                return m.reply(" Reply to a message to forward.");
            }

            const jid = args[0] || m.from;

            await sock.relayMessage(
                jid,
                m.quoted.message,
                {
                    messageId: `FORWARD_${Date.now()}`,
                    quoted: m
                }
            );

            if (jid !== m.from) {
                m.reply("Message forwarded.");
            }

        } catch (err) {
            console.error("forward error:", err);
            m.reply(` Failed to forward.\n\n${err.message}`);
        }
    }
};
