module.exports = {
    config: {
        name: 'AddBal',
        description: 'Give user a balance',
        usage: '[prefix]addBal <userID or ReplyToUser> <amount>',
        author: 'Prince',
        role: 3,
        coolDown: 5,
        aliases: ['addbal', 'addmoney']
    },
	
    onStart: async function({ rawArgs, messageData, systemData, send, api, addFont }) {
        const { messageReply } = messageData;
        const { helpers, serverFunc } = systemData;
        const { getAmount, validateBet, calculate } = helpers;

        let userID = rawArgs[0];
        let amount = rawArgs[1];

        if (messageReply) {
            userID = messageReply.senderID;
            amount = rawArgs[0];
        };

        if (!userID ||!amount) {
            const usageText = await addFont('#addBal <userID or reply> <amount>', 'italic');
            const errMsg = await addFont('Missing userID or amount.\nUsage:', 'bold');
            await send(`⚠️ ${errMsg} ${usageText}`);
            return;
        };

        if (!/^\d+$/.test(userID)) {
            const errMsg = await addFont('Invalid user ID. Must be numbers only.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        amount = await validateBet(send, amount, 'Infinity', 'amount');
        if (amount === 'exit') return;
		
        amount = getAmount(amount, { bal: 'Infinity' }, 'bal');

        const user = await serverFunc('users', 'GET', {
            columns: ['bal'],
            condition: 'WHERE id=?',
            values: [userID]
        });

        if (!user.data ||!user.data.length) {
            const errMsg = await addFont(`User ${userID} not found in database.`, 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        let currentBal = user.data[0].bal || '0';
        let newBal = await calculate(send, currentBal, 'add', amount);
        if (newBal === 'exit') return;

        await serverFunc('users', 'UPDATE', {
            columns: ['bal'],
            condition: 'WHERE id=?',
            values: [newBal, userID]
        });

        let userName = userID;
        try {
            userName = (await api.getUserInfo(userID)).name;
        } 
		
		catch (e) {};

        const successText = await addFont(`Successfully added $${amount} to ${userName}`, 'italic');
        await send(`✅️ ${successText}`);
    }
};