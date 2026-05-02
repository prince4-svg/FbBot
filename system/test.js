const { systemData } = require('./data');
const { getAmount, validateBet, calculate } = systemData.helpers;
const { serverFunc } = systemData;

// Mock send function for console
const send = async (msg) => console.log('[BOT SEND]:', msg);

async function testShoot() {
    const senderID = '100093617270335'; // Prince Har
    const rawArgs = ['50']; // test bet

    console.log('--- START TEST ---');
    console.log('Testing with senderID:', senderID);

    // 1. Get user from DB
    const user = await serverFunc('users', 'GET', {
        columns: ['bal'],
        condition: 'WHERE id=?',
        values: [senderID]
    });

    console.log('DB RESPONSE:', JSON.stringify(user, null, 2));

    if (!user.data ||!user.data.length) {
        console.log('❌ FAIL: User not found in DB');
        return;
    }

    // 2. Extract balance - columns: ['bal'] returns array of values
    let userBal = String(user.data[0]);
    console.log('USER BAL:', userBal, 'TYPE:', typeof userBal);

    // 3. Validate bet
    let bet = rawArgs[0];
    console.log('RAW BET:', bet);

    bet = await validateBet(send, bet, userBal);
    console.log('validateBet RETURNED:', bet);

    if (bet === 'exit') {
        console.log('❌ FAIL: validateBet returned exit');
        return;
    }

    // 4. Convert bet to number
    const betInt = getAmount(bet, { bal: userBal });
    console.log('getAmount RETURNED:', betInt, 'TYPE:', typeof betInt);

    if (betInt === 'exit') {
        console.log('❌ FAIL: getAmount returned exit');
        return;
    }

    // 5. Simulate game
    const winRate = 0.6;
    const isWin = Math.random() <= winRate;
    let newBal = userBal;

    console.log('ROLL:', isWin? 'WIN' : 'LOSE');

    if (!isWin) {
        newBal = await calculate(send, userBal, 'sub', betInt);
        console.log('NEW BAL AFTER LOSS:', newBal);
        if (newBal === 'exit') return;
    } else {
        const winningAmount = await calculate(send, betInt, 'mul', '2');
        console.log('WINNING AMOUNT:', winningAmount);
        if (winningAmount === 'exit') return;

        newBal = await calculate(send, userBal, 'add', winningAmount);
        console.log('NEW BAL AFTER WIN:', newBal);
        if (newBal === 'exit') return;
    }

    // 6. Update DB
    const updateRes = await serverFunc('users', 'UPDATE', {
        columns: ['bal'],
        condition: 'WHERE id=?',
        values: [newBal, senderID]
    });

    console.log('DB UPDATE RESPONSE:', updateRes);
    console.log('--- END TEST ---');
    console.log('✅ SUCCESS: Final balance should be', newBal);
}

testShoot().catch(err => {
    console.error('❌ CRASH:', err);
});
