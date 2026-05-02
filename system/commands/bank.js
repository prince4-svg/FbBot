async function checkBalance(senderID, serverFunc, send, addFont) {
    const user = await serverFunc('users', 'GET', {
        columns: ['name', 'bank'],
        condition: 'WHERE id=?',
        values: [senderID]
    });
	
    const name = user.data[0];
    const bank = user.data[1];

    const ownerText = await addFont(`Bank Owner: ${name}`, 'bold');
    const balanceText = await addFont(`Balance: $${bank}`, 'italic');
    await send(`🏦 ${ownerText}\n💰 ${balanceText}`);
};


async function deposit(senderID, amount, serverFunc, send, calculate, addFont) {
    const user = await serverFunc('users', 'GET', {
        columns: ['bal', 'bank'],
        condition: 'WHERE id=?',
        values: [senderID]
    });

    let bal = await calculate(send, user.data[0], 'sub', amount);
    if (bal === 'exit') return;
	
    let bank = await calculate(send, user.data[1], 'add', amount);
    if (bank === 'exit') return;

    await serverFunc('users', 'UPDATE', {
        columns: ['bal', 'bank'],
        condition: 'WHERE id=?',
        values: [bal, bank, senderID]
    });

    const successText = await addFont(`Successfully deposited $${amount} into your bank account.`, 'bold');
    await send(`✅️ ${successText}`);
};


async function withdraw(senderID, amount, serverFunc, send, calculate, addFont) {
    const user = await serverFunc('users', 'GET', {
        columns: ['bal', 'bank'],
        condition: 'WHERE id=?',
        values: [senderID]
    });

    let bal = await calculate(send, user.data[0], 'add', amount);
    if (bal === 'exit') return;
	
    let bank = await calculate(send, user.data[1], 'sub', amount);
    if (bank === 'exit') return;

    await serverFunc('users', 'UPDATE', {
        columns: ['bal', 'bank'],
        condition: 'WHERE id=?',
        values: [bal, bank, senderID]
    });

    const successText = await addFont(`Successfully withdrawn $${amount} from your bank account.`, 'bold');
    await send(`✅️ ${successText}`);
};


async function transfer(senderID, targetID, amount, serverFunc, api, send, calculate, addFont) {
    const sender = await serverFunc('users', 'GET', {
        columns: ['bank'],
        condition: 'WHERE id=?',
        values: [senderID]
    });
	
    const target = await serverFunc('users', 'GET', {
        columns: ['bank'],
        condition: 'WHERE id=?',
        values: [targetID]
    });

    let senderBank = await calculate(send, sender.data[0], 'sub', amount);
    if (senderBank === 'exit') return;
	
    let targetBank = await calculate(send, target.data[0], 'add', amount);
    if (targetBank === 'exit') return;

    await serverFunc('users', 'UPDATE', {
        columns: ['bank'],
        condition: 'WHERE id=?',
        values: [senderBank, senderID]
    });
	
    await serverFunc('users', 'UPDATE', {
        columns: ['bank'],
        condition: 'WHERE id=?',
        values: [targetBank, targetID]
    });

    const targetUser = (await api.getUserInfo(targetID))[targetID];
    const successText = await addFont(`Successfully transferred $${amount} to ${targetUser.name}'s bank account.`, 'bold');
    await send(`✅️ ${successText}`);
}


module.exports = {
    config: {
        name: 'Bank',
        description: 'Manage your bank account',
        usage: '[prefix]Bank deposit/withdraw <amount> or Bank <check> or Bank <transfer> <userID or replyToUser> <amount>',
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['b']
    },
	
    onStart: async function({ api, rawArgs, send, systemData, messageData, addFont }) {
        const { senderID, messageReply } = messageData;
        const { prefix } = systemData.getData();
        const { validateBet, getAmount, calculate } = systemData.helpers;
        const { serverFunc } = systemData;

        const user = await serverFunc('users', 'GET', {
            columns: ['bal', 'bank'],
            condition: 'WHERE id=?',
            values: [senderID]
        });
		
        const userData = { bal: user.data[0], bank: user.data[1] };

        const args = rawArgs;
        if (!args.length) {
            const errMsg = await addFont('Enter your action to continue', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        const action = args[0].toLowerCase();
        switch (action) {
            case 'check':
                await checkBalance(senderID, serverFunc, send, addFont);
                break;

            case 'deposit':
                let depositAmount = await validateBet(send, args[1], userData.bal, 'amount');
                if (depositAmount === 'exit') return;
				
                depositAmount = getAmount(depositAmount, userData);
                await deposit(senderID, depositAmount, serverFunc, send, calculate, addFont);
                break;

            case 'withdraw':
                let withdrawAmount = await validateBet(send, args[1], userData.bank, 'amount', 'bank balance');
                if (withdrawAmount === 'exit') return;
				
                withdrawAmount = getAmount(withdrawAmount, userData, 'bank');
                await withdraw(senderID, withdrawAmount, serverFunc, send, calculate, addFont);
                break;

            case 'transfer':
                let targetID, transferAmount;
                if (messageReply) {
                    targetID = messageReply.senderID;
					
                    transferAmount = await validateBet(send, args[1], userData.bank, 'amount', 'bank balance');
                    if (transferAmount === 'exit') return;
					
                    transferAmount = getAmount(transferAmount, userData, 'bank');
                }
				
				else {
                    targetID = args[1];
					
                    transferAmount = await validateBet(send, args[2], userData.bank, 'amount', 'bank balance');
                    if (transferAmount === 'exit') return;
					
                    transferAmount = getAmount(transferAmount, userData, 'bank');
                };
				
                await transfer(senderID, targetID, transferAmount, serverFunc, api, send, calculate, addFont);
                break;

            default:
                const usageText = await addFont(`${prefix}Bank deposit/withdraw <amount> or Bank <check> or Bank <transfer> <userID or replyToUser> <amount>`, 'italic');
                const errMsg = await addFont('Invalid action. Usage is', 'bold');
                await send(`⚠️ ${errMsg} ${usageText}`);
        };
    }
};