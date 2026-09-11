module.exports = {
    name: 'promote',
    aliases: ['demote'],

    async execute(sock, m, args) {
        if (!m.isGroup) {
            return await m.reply('ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs!')
        }

        if (!m.isOwner && !m.isAdmin) {
            return await m.reply('ᴏɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴏᴡɴᴇʀs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!')
        }

        let target = null

        if (m.quoted?.sender) {
            target = m.quoted.sender
        }

        if (!target && Array.isArray(m.mentionedJid) && m.mentionedJid.length) {
            target = m.mentionedJid[0]
        }

        if (!target) {
            const text = m.body || m.text || m.message?.extendedTextMessage?.text || ''
            const mentionedNumber = text.match(/@(\d+)/)?.[1]

            if (mentionedNumber) {
                const participant = m.groupMetadata?.participants?.find(
                    p => p.id.split('@')[0] === mentionedNumber
                )

                if (participant) {
                    target = participant.id
                }
            }
        }

        if (!target) {
            return await m.reply(
                `ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ's ᴍᴇssᴀɢᴇ ᴏʀ ᴛᴀɢ ᴛʜᴇᴍ.\n\n` +
                `ᴇxᴀᴍᴘʟᴇ:\n` +
                `.ᴘʀᴏᴍᴏᴛᴇ @ᴜsᴇʀ\n` +
                `.ᴅᴇᴍᴏᴛᴇ @ᴜsᴇʀ`
            )
        }

        const command = m.command?.toLowerCase() || 'promote'
        const action = command === 'demote' ? 'demote' : 'promote'

        try {
            await sock.groupParticipantsUpdate(
                m.from,
                [target],
                action
            )

            if (action === 'promote') {
                return await m.reply('ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴘʀᴏᴍᴏᴛᴇᴅ ᴛᴏ ᴀᴅᴍɪɴ.')
            }

            return await m.reply('ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴅᴇᴍᴏᴛᴇᴅ.')
        } catch (error) {
            console.error(`${action} error:`, error)

            return await m.reply(
                `ғᴀɪʟᴇᴅ ᴛᴏ ${action} ᴜsᴇʀ.\n\n${error.message}`
            )
        }
    }
}
