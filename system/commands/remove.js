module.exports = {
    config: {
        name: 'Remove',
        description: 'Delete bot message.',
        usage: '[prefix]Remove <replyToMessage>',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['un', 'rm']    
    },
    
    onStart: async function({ messageData, botID, send, unsend }) {
		const { messageReply } = messageData;
		
		if (!messageReply) {
			await send('⚠️ Please reply to a message.');
			return;
		};
		
		const { senderID, messageID } = messageReply;
		if (senderID !== botID) {
			await send('⚠️ I can only unsend my message.');
			return;
		};
		
		await unsend(messageID);
    }
};