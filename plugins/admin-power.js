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

        let target

        if (m.quoted?.sender) {
            target = m.quoted.sender
        } else if (m.mentionedJid?.length) {
            target = m.mentionedJid[0]
        } else {
            return await m.reply(
                `ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ's ᴍᴇssᴀɢᴇ ᴏʀ ᴍᴇɴᴛɪᴏɴ ᴛʜᴇᴍ.\n\n` +
                `ᴇxᴀᴍᴘʟᴇ:\n` +
                `.ᴘʀᴏᴍᴏᴛᴇ @ᴜsᴇʀ\n` +
                `.ᴅᴇᴍᴏᴛᴇ @ᴜsᴇʀ`
            )
        }

        const command = m.command?.toLowerCase()

        const action = command === 'demote'
            ? 'demote'
            : 'promote'

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
            return await m.reply(`ғᴀɪʟᴇᴅ ᴛᴏ ${action} ᴜsᴇʀ.\n\n${error.message}`)
        }
    }
}
