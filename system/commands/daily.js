module.exports = {
    config: {
        name: 'Daily',
        description: 'Get amount in 5 min',
        usage: '[prefix]Daily',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['reward']
    },

    onStart: async function({ send, systemData, messageData }) {
        const { senderID } = messageData;
        const { serverFunc, saveData, getSavedData } = systemData;
        const { calculate } = systemData.helpers;

        const savedData = getSavedData();
        const lastUse = savedData[senderID]?.dailyLastUse? new Date(savedData[senderID].dailyLastUse) : null;

        let minOffsetUsage = null;
        if (lastUse) {
            minOffsetUsage = (new Date() - lastUse) / (1000 * 60);
        };

        if (!minOffsetUsage || minOffsetUsage >= 5) {
            const amount = '1,000,000';
            const user = await serverFunc('users', 'GET', {
                columns: ['bal'],
                condition: 'WHERE id=?',
                values: [senderID]
            });

            let currentBal = user.data[0];
            let newBal = await calculate(send, currentBal, 'add', amount);
            if (newBal === 'exit') return;

            await serverFunc('users', 'UPDATE', {
                columns: ['bal'],
                condition: 'WHERE id=?',
                values: [newBal, senderID]
            });

            savedData[senderID] = {
               ...(savedData[senderID] || {}),
                dailyLastUse: new Date().toISOString()
            };
            saveData(savedData);

            await send(`🎁 You've claimed your reward $${amount} Go back again after 5 min`);
        }
		
		else {
            await send(`⚠️ You've already claim your reward! Please try again after ${Math.round(5 - minOffsetUsage)} min`);
        };
    }
};