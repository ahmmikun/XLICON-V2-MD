const zlib = require('node:zlib');

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
        const nameBuffer = Buffer.from(name);
        const data = Buffer.from(content);
        const crc = zlib.crc32(data) >>> 0;

        const local = Buffer.alloc(30 + nameBuffer.length);

        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(nameBuffer.length, 26);

        nameBuffer.copy(local, 30);

        localParts.push(local, data);

        const central = Buffer.alloc(46 + nameBuffer.length);

        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(nameBuffer.length, 28);
        central.writeUInt32LE(offset, 42);

        nameBuffer.copy(central, 46);

        centralParts.push(central);

        offset += local.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);

    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(Object.keys(files).length, 8);
    end.writeUInt16LE(Object.keys(files).length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);

    return Buffer.concat([
        ...localParts,
        centralDirectory,
        end
    ]);
}

function createDocx(text) {
    const files = {
        '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,

        '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1"
Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
Target="word/document.xml"/>
</Relationships>`,

        'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
<w:r>
<w:t xml:space="preserve">${escapeXml(text)}</w:t>
</w:r>
</w:p>
<w:sectPr/>
</w:body>
</w:document>`
    };

    return createZip(files);
}

function escapePdfText(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}

function createPdf(text) {
    const lines = text.split(/\r?\n/);
    const objects = [];

    objects.push(
        '<< /Type /Catalog /Pages 2 0 R >>'
    );

    objects.push(
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'
    );

    objects.push(
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>'
    );

    const content = [];

    content.push('BT');
    content.push('/F1 12 Tf');
    content.push('50 800 Td');

    let firstLine = true;

    for (const line of lines) {
        const safeLine = escapePdfText(line);

        if (!firstLine) {
            content.push('0 -18 Td');
        }

        content.push(`(${safeLine}) Tj`);

        firstLine = false;
    }

    content.push('ET');

    const stream = content.join('\n');

    objects.push(
        `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`
    );

    objects.push(
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    );

    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    for (let i = 0; i < objects.length; i++) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));

        pdf += `${i + 1} 0 obj\n`;
        pdf += `${objects[i]}\n`;
        pdf += 'endobj\n';
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');

    pdf += `xref\n`;
    pdf += `0 ${objects.length + 1}\n`;
    pdf += `0000000000 65535 f \n`;

    for (let i = 1; i < offsets.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n`;
    pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n`;
    pdf += `${xrefOffset}\n`;
    pdf += `%%EOF`;

    return Buffer.from(pdf, 'utf8');
}

module.exports = {
    name: 'write',
    aliases: ['w'],

    async execute(sock, m, args) {
        if (args.length < 2) {
            return m.reply(
                `ᴜsᴀɢᴇ:\n\n.write txt hi\n.write docx hi\n.write pdf hi`
            );
        }

        const format = args[0].toLowerCase();
        const text = args.slice(1).join(' ').trim();

        if (!text) {
            return m.reply(
                'ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ sᴏᴍᴇ ᴛᴇxᴛ.'
            );
        }

        try {
            if (format === 'txt') {
                const buffer = Buffer.from(text, 'utf8');

                await sock.sendMessage(m.from, {
                    document: buffer,
                    mimetype: 'text/plain',
                    fileName: 'document.txt'
                });

                return;
            }

            if (format === 'docx') {
                const buffer = createDocx(text);

                await sock.sendMessage(m.from, {
                    document: buffer,
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    fileName: 'document.docx'
                });

                return;
            }

            if (format === 'pdf') {
                const buffer = createPdf(text);

                await sock.sendMessage(m.from, {
                    document: buffer,
                    mimetype: 'application/pdf',
                    fileName: 'document.pdf'
                });

                return;
            }

            await m.reply(
                `ғᴏʀᴍᴀᴛ ɴᴏᴛ sᴜᴘᴘᴏʀᴛᴇᴅ\n\nᴜsᴇ: ᴛxᴛ, ᴅᴏᴄx ᴏʀ ᴘᴅꜰ`
            );

        } catch (err) {
            console.error('write error:', err);

            await m.reply(
                `ғᴀɪʟᴇᴅ\n\n${err.message}`
            );
        }
    }
};
