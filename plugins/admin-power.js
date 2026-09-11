module.exports = {
    name: 'promote',
    aliases: ['demote'],

    async execute(sock, m) {
        if (!m.isGroup) {
            return await m.reply('ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs!')
        }

        if (!m.isOwner && !m.isAdmin) {
            return await m.reply('ᴏɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴏᴡɴᴇʀs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!')
        }

        const text = m.body || m.text || m.message?.extendedTextMessage?.text || ''
        const command = text.trim().split(/\s+/)[0].replace(/^[.!#$%^&*]+/, '').toLowerCase()

        const action = command === 'demote' ? 'demote' : 'promote'

        let target = m.quoted?.sender || m.mentionedJid?.[0]

        if (!target) {
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
            return await m.reply('ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ ᴏʀ ᴛᴀɢ ᴛʜᴇᴍ.')
        }

        try {
            await sock.groupParticipantsUpdate(
                m.from,
                [target],
                action
            )

            if (action === 'demote') {
                return await m.reply('ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴅᴇᴍᴏᴛᴇᴅ.')
            }

            return await m.reply('ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴘʀᴏᴍᴏᴛᴇᴅ ᴛᴏ ᴀᴅᴍɪɴ.')
        } catch (error) {
            console.error(`${action} error:`, error)

            return await m.reply(
                `ғᴀɪʟᴇᴅ ᴛᴏ ${action} ᴜsᴇʀ.\n\n${error.message}`
            )
        }
    }
}
