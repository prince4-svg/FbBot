module.exports = {
    config: {
        name: 'Slot',
        description: 'Fake money game',
        usage: '[prefix]Slot <bet>',
        author: 'PrinceDev',
        role: 0,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ api, rawArgs, send, systemData, messageData, addFont }) {
        const { senderID } = messageData;
        const { getAmount, validateBet, calculate } = systemData.helpers;
        const { serverFunc } = systemData;

        const user = await serverFunc('users', 'GET', {
            columns: ['bal'],
            condition: 'WHERE id=?',
            values: [senderID]
        });
		
        let userBal = user.data[0];

        let strBet = rawArgs[0];
        strBet = await validateBet(send, strBet, userBal);
        if (strBet === 'exit') return;
		
        strBet = getAmount(strBet, { bal: userBal }, 'bal');

        const randomChar = arr => arr[Math.floor(Math.random() * arr.length)];
        const charsList = ['👑', '💎', '🔔', '🪙', '🍉', '🍏', '🍇', '🫐', '🍓', '🍒'];
		
        const spinningText = await addFont('Spinning...', 'italic');
        const spiningMess = await send(`🎰  ❲  ❓️  |  ❓️  |  ❓️  ❳  🎰\n${spinningText}`);
        const { messageID } = spiningMess;

        let resultsList = [];
        let r1, r2, r3;
        const specialItemIndex = randomChar([0, 1, 2]);
        for (let i = 0; i < 3; i++) {
            if (i!== specialItemIndex) {
                resultsList.push(randomChar(charsList));
            }
			
			else {
                const winRate = 0.6;
                const isWin = Math.random() <= winRate;
                let specialItem = randomChar(charsList);
                
				if (isWin && resultsList.length > 0) {
                    specialItem = resultsList[0];
                };
				
                resultsList.push(specialItem);
            };
			
            [r1, r2, r3] = resultsList;
            r1 = r1 || '❓️';
            r2 = r2 || '❓️';
            r3 = r3 || '❓️';
			
            await api.editMessage(`🎰  ❲  ${r1}  |  ${r2}  |  ${r3}  ❳  🎰`, messageID);
            await new Promise(resolve => setTimeout(resolve, 500));
        };

        const itemMultiplier = {
            '👑': 5, '💎': 4, '🔔': 2, '🪙': 3, '🍉': 1,
            '🍏': 2, '🍇': 2, '🫐': 3, '🍓': 4, '🍒': 3
        };
		
        const resultSize = new Set(resultsList).size;
        let body;
        let multiplierStr = '';
        let newBal = userBal;

        if (resultSize === 3) {
            newBal = await calculate(send, userBal, 'sub', strBet);
			
            if (newBal === 'exit') return;
            body = await addFont(`Sorry! You lose your $${strBet}`, 'italic');
        }
		
		else {
            let multiplierObj = {};
            let betMultiplier = 0;
            for (const item of resultsList) {
                const multiplierScore = itemMultiplier[item];
                betMultiplier += multiplierScore;
				
                if (!(item in multiplierObj)) {
                    multiplierObj[item] = { count: 1, amount: multiplierScore };
                }
				
				else {
                    multiplierObj[item].count += 1;
                    multiplierObj[item].amount += multiplierScore;
                };
            };
			
            multiplierStr = await addFont("\n\nMultiplier:", 'bold');
            for (const [item, data] of Object.entries(multiplierObj)) {
                multiplierStr += `\n${item} (${data.count}x) → ${data.amount}x`;
            };

            if (resultSize === 2) {
                const winningAmount = await calculate(send, strBet, 'mul', String(betMultiplier));
                if (winningAmount === 'exit') return;
				
                newBal = await calculate(send, userBal, 'add', winningAmount);
                if (newBal === 'exit') return;
				
                body = await addFont(`You win! ${betMultiplier}x your bet. You get $${winningAmount}`, 'italic');
            }
			
			else {
                betMultiplier = await calculate(send, String(betMultiplier), 'add', '1000');
                if (betMultiplier === 'exit') return;
				
                const winningAmount = await calculate(send, strBet, 'mul', betMultiplier);
                if (winningAmount === 'exit') return;
				
                newBal = await calculate(send, userBal, 'add', winningAmount);
                if (newBal === 'exit') return;
				
                body = await addFont(`You hit strike! ${betMultiplier}x your bet. You get $${winningAmount}`, 'italic');
                const strikeText = await addFont(`${r1} (STRIKE) → 1000x`, 'bold');
                multiplierStr += `\n${strikeText}`;
            };
        };

        await serverFunc('users', 'UPDATE', {
            columns: ['bal'],
            condition: 'WHERE id=?',
            values: [newBal, senderID]
        });
		
        const line = "────────────────";
        await api.editMessage(`🎰  ❲  ${r1}  |  ${r2}  |  ${r3}  ❳  🎰\n${line}\n${body}\n${line}${multiplierStr}`, messageID);
    }
};