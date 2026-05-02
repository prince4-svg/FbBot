const fs = require('fs');
const path = require('path');


module.exports = {
    config: {
        name: 'botAdd',
        description: 'Send message to thread when added',
        usage: 'Auto',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: []
    },

    onEvent: async function({ event, send, botID }) {
        const { logMessageType, logMessageData, threadID } = event;

        if (logMessageType!== 'log:subscribe') return;
        if (!logMessageData.addedParticipants.some(user => user.userFbId === botID)) return;

        const imgPath = path.join(__dirname, '../../images/botAdd.jpg');
		const imageStream = fs.createReadStream(imgPath);
        await send({
			attachment: imageStream,
			body: 'WASSUP'
		}, threadID, null);
    }
};