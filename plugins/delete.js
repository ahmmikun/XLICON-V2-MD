module.exports = {
    name: 'del',
    aliases: ['delete'],
    description: 'Delete a quoted message',

    async execute(sock, m) {
        
        await m.react('🧹');
        if (!m.isOwner && !m.isAdmin) return

        if (!m.quoted) {
            return await m.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ ᴛᴏ ᴅᴇʟᴇᴛᴇ ɪᴛ!')
        }

        const key = m.quoted.key

        await sock.sendMessage(m.from, {
            delete: key
        })
    }
}
