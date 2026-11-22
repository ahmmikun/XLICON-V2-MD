module.exports = {
    name: 'promote',
    aliases: ['demote'],
    description: 'Promote or demote group members',
    tags: ['admin'],

    async execute(sock, m, args = []) {
        if (!m.isGroup) {
            return await m.reply('ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs!');
        }

        if (!m.isOwner && !m.isAdmin) {
            return await m.reply('ᴏɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴏᴡɴᴇʀs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!');
        }

        const text = m.body || m.text || '';
        const command = text.trim().split(/\s+/)[0].replace(/^[.!#$%^&*]+/, '').toLowerCase();
        const action = command === 'demote' ? 'demote' : 'promote';

        let target = null;

        if (m.quoted) {
            target = m.quoted.participant || m.quoted.sender || m.quoted.key?.participant;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        } else if (args[0]) {
            const clean = args[0].replace(/[@\s]/g, '');
            if (/^\d+$/.test(clean)) {
                target = clean + '@s.whatsapp.net';
            } else if (clean.includes('@')) {
                target = clean;
            }
        }

        if (!target) {
            return await m.reply('ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ ᴏʀ ᴛᴀɢ ᴛʜᴇᴍ.');
        }

        target = target.split(':')[0];
        if (!target.includes('@')) {
            target = `${target}@s.whatsapp.net`;
        }

        if (m.groupMetadata?.participants) {
            const targetBase = target.split('@')[0].split(':')[0];
            const found = m.groupMetadata.participants.find(p => {
                const pBase = (p.id || '').split('@')[0].split(':')[0];
                const phoneBase = (p.phoneNumber || '').split('@')[0].split(':')[0];
                return pBase === targetBase || phoneBase === targetBase;
            });
            if (found?.id) {
                target = found.id;
            }
        }

        try {
            await sock.groupParticipantsUpdate(
                m.from,
                [target],
                action
            );

            if (action === 'demote') {
                return await m.reply('ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴅᴇᴍᴏᴛᴇᴅ.', { mentions: [target] });
            }

            return await m.reply('ᴜsᴇʀ ʜᴀs ʙᴇᴇɴ ᴘʀᴏᴍᴏᴛᴇᴅ ᴛᴏ ᴀᴅᴍɪɴ.', { mentions: [target] });
        } catch (error) {
            console.error(`${action} error:`, error);
            if (error?.message?.includes('403') || error?.data === 403) {
                return await m.reply('ɪ ᴅᴏ ɴᴏᴛ ʜᴀᴠᴇ ᴘᴇʀᴍɪssɪᴏɴ. ᴍᴀᴋᴇ sᴜʀᴇ ɪ ᴀᴍ ᴀɴ ᴀᴅᴍɪɴ.');
            }
            return await m.reply(`ғᴀɪʟᴇᴅ ᴛᴏ ${action} ᴜsᴇʀ.\n\n${error.message}`);
        }
    }
};
