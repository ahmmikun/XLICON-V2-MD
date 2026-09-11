module.exports = {
    name: 'creator',
    description: 'Creator/Owner contacts',
    aliases: ['owner', 'creator', 'Gowner'],
    tags: ['main'],
    command: /^(owner|creator|Gowner)$/i,

    async execute(sock, m) {
        try {
             
            await m.react('👑');
            const owners = [
                ['233533763772@s.whatsapp.net', 'Abraham']
            ];

            const contacts = owners.map(([id, name]) => ({
                displayName: name,
                vcard: `BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
TEL;waid=${id.split('@')[0]}:${id.split('@')[0]}
X-WA-BIZ-DESCRIPTION:ABZTECH MAIN OWNER
X-WA-BIZ-NAME:${name}
END:VCARD`
            }));

            await sock.sendMessage(m.from, {
                contacts: { contacts }
            });

        } catch (err) {
            console.error(' Creator command error:', err);

            if (m?.reply) await m.reply('An error occurred while fetching the creator info.');
        }
    }
};
