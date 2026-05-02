async function showMulti(api, send, targetIDs, addFont) {
    let header = await addFont('Users ID:', 'bold');
    let body = `🔖 ${header}\n`;

    for (const targetID of targetIDs) {
        try {
            const targetName = (await api.getUserInfo(targetID)).name;
            body += `${targetName} — ${targetID}\n`;
        }
		
		catch (e) {
            body += `Unknown — ${targetID}\n`;
        };
    };
	
    await send(body);
};


async function showOne(send, senderID, addFont) {
    const label = await addFont('Your UID:', 'bold');
    await send(`${label} ${senderID}`);
};

module.exports = {
    config: {
        name: 'Uid',
        description: 'Show user id',
        usage: '[prefix]Uid or ([prefix]Uid <replyToUser> or [prefix]Uid <mention> or both.)',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['id', 'userid']
    },
	
    onStart: async function({ messageData, send, api, addFont }) {
        const { mentions, messageReply, senderID } = messageData;
        const mentionIDs = Object.keys(mentions);

        if (!mentionIDs.length &&!messageReply) {
            await showOne(send, senderID, addFont);
            return;
        };

        let targetIDs = mentionIDs || [];
        if (messageReply) {
            targetIDs.push(messageReply.senderID);
        };

        targetIDs = [...new Set(targetIDs)];

        await showMulti(api, send, targetIDs, addFont);
    }
};