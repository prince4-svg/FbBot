module.exports = {
    config: {
        name: 'RegisterUsers',
        description: 'Register users from database.',
        usage: 'Auto',
        author: 'PrinceDev',
		role: 'Helper'
    },
    
    onMessage: async function({ systemData, messageData, api }) {
		const { senderID } = messageData;
		const { serverFunc } = systemData;
		
		const user = await serverFunc('users', 'GET', {
			condition: 'WHERE id=?',
			values: [senderID]
		});
		if (senderID && !user.data) {
        	const userName = (await api.getUserInfo(senderID)).name;
            await serverFunc('users', 'INSERT', {
				columns: ['id', 'name', 'bal', 'bank'],
				values: [senderID, userName, '4,000', '4,000']
			});
        };
    }
};