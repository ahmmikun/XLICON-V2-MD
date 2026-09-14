const antiLinkChats = new Map()

const linkRegex = /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/)[^\s]+/i

module.exports = {
    name: 'antilink',
    aliases: ['al'],
    description: 'Automatically delete messages containing links',

    async execute(sock, m, args) {
        if (!m.isOwner && !m.isAdmin) return

        const jid = m.from
        const action = args[0]?.toLowerCase()

        if (action === 'on') {
            antiLinkChats.set(jid, true)
            return await m.reply('ᴀɴᴛɪʟɪɴᴋ ᴏɴ')
        }

        if (action === 'off') {
            antiLinkChats.delete(jid)
            return await m.reply('ᴀɴᴛɪʟɪɴᴋ ᴏғғ')
        }

        return await m.reply(
            `ᴀɴᴛɪʟɪɴᴋ: ${antiLinkChats.has(jid) ? 'ᴏɴ' : 'ᴏғғ'}\n\nᴜsᴇ: .antilink on/off`
        )
    },

    async onMessage(sock, m) {
        if (!m.from?.endsWith('@g.us')) return false
        if (!antiLinkChats.has(m.from)) return false
        if (m.isAdmin || m.isOwner) return false

        const text =
            m.body ||
            m.text ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ''

        if (!text || !linkRegex.test(text)) return false

        try {
            await sock.sendMessage(m.from, {
                delete: m.key
            })

            console.log(`[ANTILINK] Deleted link message in ${m.from}`)
        } catch (e) {
            console.log('ᴀɴᴛɪʟɪɴᴋ delete error:', e.message)
        }

        return false
    }
}
