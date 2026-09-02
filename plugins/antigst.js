const statusChats = new Map()

module.exports = {
    name: 'antigcst',
    aliases: ['agst'],
    description: 'Automatically delete group status messages',

    async execute(sock, m, args) {
        if (!m.isOwner && !m.isAdmin) return

        const jid = m.from
        const action = args[0]?.toLowerCase()

        if (action === 'on') {
            statusChats.set(jid, true)
            return await m.reply('ᴀɴᴛɪɢʀᴏᴜᴘsᴛ ᴏɴ')
        }

        if (action === 'off') {
            statusChats.delete(jid)
            return await m.reply('ᴀɴᴛɪɢʀᴏᴜᴘsᴛ ᴏғғ')
        }

        return await m.reply(`ᴀɴᴛɪɢʀᴏᴜᴘsᴛ: ${statusChats.has(jid) ? 'ᴏɴ' : 'ᴏғғ'}\n\nᴜsᴇ: .antigroupst on/off`)
    },

    async onMessage(sock, m) {
        if (m.type !== 'groupStatusMessageV2') return false

        const jid = m.from
        if (!jid || !statusChats.has(jid)) return false

        try {
            await sock.sendMessage(jid, {
                delete: m.key
            })
        } catch (e) {
            console.log('Antigroupst delete error:', e.message)
        }

        return false
    }
}
