module.exports = {
    config: {
        name: 'Shoot',
        description: 'Ball gambling game',
        usage: '[prefix]Shoot <bet>',
        author: 'PrinceDev',
        role: 0,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ send, rawArgs, systemData, messageData, addFont }) {
        const { senderID } = messageData;
        const { getAmount, validateBet, calculate } = systemData.helpers;
        const { serverFunc } = systemData;

        const user = await serverFunc('users', 'GET', {
            columns: ['bal'],
            condition: 'WHERE id=?',
            values: [senderID]
        });
		
        let userBal = user.data[0];

        let bet = rawArgs[0];
        bet = await validateBet(send, bet, userBal);
        if (bet === 'exit') return;
		
        bet = getAmount(bet, { bal: userBal });

        const winRate = 0.6;
        const isWin = Math.random() <= winRate;
        let body;
        let newBal = userBal;

        if (!isWin) {
            newBal = await calculate(send, userBal, 'sub', bet);
            if (newBal === 'exit') return;
			
            const loseText = await addFont(`You lost: $${bet}`, 'bold');
            const descText = await addFont('The Ball missed', 'italic');
            body = `${descText} ⛹🏻‍♂️🏀\n━━━━━━━━━━━━\n\n${loseText}`;
        }
		
		else {
            const winningAmount = await calculate(send, bet, 'mul', '2');
            if (winningAmount === 'exit') return;
			
            newBal = await calculate(send, userBal, 'add', winningAmount);
            if (newBal === 'exit') return;
			
            const winText = await addFont(`You won: $${winningAmount}`, 'bold');
            const descText = await addFont('The ball was shoot successfully', 'italic');
            body = `${descText} ⛹🏻‍♂️🏀\n━━━━━━━━━━━━\n\n${winText}`;
        };

        await serverFunc('users', 'UPDATE', {
            columns: ['bal'],
            condition: 'WHERE id=?',
            values: [newBal, senderID]
        });
		
        await send(body);
    }
};