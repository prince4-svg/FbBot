function challenge(threadID, saveData, senderID, userBet, challengedUserID) {
    saveData({
        [threadID]: {
            tttGame: {
                status: 'pending',
                players: [senderID, challengedUserID],
                challengerUserID: senderID,
                challengedUserID,
                turnCount: 0,
                gameBet: userBet,
                gameTurn: "",
                gameTurnID: "",
                gameBoardMessageID: "",
                gameLastTurnTimestamp: "",
                gameSpace: Array(9).fill('🔲')
            }
        }
    });
	
    return userBet;
};


async function showGame(addFont, api, tttGame, send, turnID = null, turnSymbol = null, edit = true) {
    const [s1, s2, s3, s4, s5, s6, s7, s8, s9] = tttGame.gameSpace;
    const messageID = tttGame?.gameBoardMessageID;
    if (!turnID) turnID = tttGame.gameTurnID;
    if (!turnSymbol) turnSymbol = tttGame.gameTurn;

    const userNickName = (await api.getUserInfo(turnID)).name.split(' ')[0];
    const userSymbol = turnSymbol === 'X'? '❎️' : '✅️';

    const turnText = await addFont(`${userNickName}'s turn`, 'bold');
    const msg = await addFont(`📍 Note: If no move receive under 5 min, game ends and you lose your bet.`, 'italic');
    const board = `${s1}|${s2}|${s3}\n${s4}|${s5}|${s6}\n${s7}|${s8}|${s9}`;
    const fullMsg = `${board}\n\n${turnText} (${userSymbol})\n${msg}`;

    if (edit && messageID) {
        await api.editMessage(fullMsg, messageID);
    }
	
	else {
        return await send(fullMsg);
    };
};


async function checkGameState(addFont, tttGame, savedData, saveData, messageData, serverFunc, threadID, send, helpers) {
    const { calculate } = helpers;
    const playersSymbol = ['❎️', '✅️'];
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    if (tttGame.turnCount === 9) {
        saveData({ [threadID]: {} });
        const tieMsg = await addFont(`🤝 It's a tie. Good game!`, 'bold');
        return tieMsg;
    };

    const gameSpace = tttGame.gameSpace;
    for (const symbol of playersSymbol) {
        for (const combo of winningCombos) {
            const isMatchAll = combo.every(index => gameSpace[index] === symbol);
            if (isMatchAll) {
                const winnerID = messageData.senderID;
                const loserID = winnerID === tttGame.challengerUserID? tttGame.challengedUserID : tttGame.challengerUserID;
                const winnerName = messageData.name;

                const winningAmount = await calculate(send, tttGame.gameBet, 'mul', '2');
                if (winningAmount === 'exit') return;

                const winner = await serverFunc('users', 'GET', { columns: ['bal'], condition: 'WHERE id=?', values: [winnerID] });
                const loser = await serverFunc('users', 'GET', { columns: ['bal'], condition: 'WHERE id=?', values: [loserID] });

                let winnerBal = await calculate(send, winner.data[0]?.bal || '0', 'add', winningAmount);
                if (winnerBal === 'exit') return;
				
                let loserBal = await calculate(send, loser.data[0]?.bal || '0', 'sub', tttGame.gameBet);
                if (loserBal === 'exit') return;

                await serverFunc('users', 'UPDATE', { columns: ['bal'], condition: 'WHERE id=?', values: [winnerBal, winnerID] });
                await serverFunc('users', 'UPDATE', { columns: ['bal'], condition: 'WHERE id=?', values: [loserBal, loserID] });

                saveData({ [threadID]: {} });
                const winMsg = await addFont(`🎉 ${winnerName} Won! You get $${winningAmount}`, 'bold');
                return winMsg;
            };
        };
    };
};


async function play(addFont, api, threadID, serverFunc, send, messageData, saveData, getSavedData, turnSymbol, placeIndex, helpers) {
    const savedData = getSavedData() || {};
    const placeValue = turnSymbol === 'X'? '❎️' : '✅️';
    const nextTurn = turnSymbol === 'X'? 'Y' : 'X';
    const tttGame = savedData[threadID].tttGame;
    const nextTurnID = tttGame.gameTurnID === tttGame.challengerUserID? tttGame.challengedUserID : tttGame.challengerUserID;

    savedData[threadID].tttGame.gameSpace[placeIndex] = placeValue;
    savedData[threadID].tttGame.turnCount += 1;
    savedData[threadID].tttGame.gameLastTurnTimestamp = new Date().toISOString();
    savedData[threadID].tttGame.gameTurn = nextTurn;
    savedData[threadID].tttGame.gameTurnID = nextTurnID;

    await showGame(addFont, api, tttGame, send);

    const status = await checkGameState(addFont, tttGame, savedData, saveData, messageData, serverFunc, threadID, send, helpers);
    if (status) {
        await send(status);
        return;
    };
	
    saveData(savedData);
};


module.exports = {
    config: {
        name: 'TicTacToe',
        usage: '[prefix]TicTacToe <challenge> <userID or ReplyToUser> <amount> or [prefix]TicTacToe <accept/reject> or [prefix]TicTacToe <play> <placeIndex [1-9]>',
        description: 'Online 1v1 TicTacToe game',
        author: 'PrinceDev',
        role: 0,
        coolDown: 5,
        aliases: ['ttt']
    },
	
    onStart: async function({ api, systemData, messageData, rawArgs, send, addFont }) {
        let action = rawArgs[0];
        if (!action) {
            const errMsg = await addFont('⚠️ Enter your action to continue.', 'bold');
            await send(errMsg);
            return;
        };

        const { senderID, messageReply, threadID } = messageData;
        const { validateBet, getAmount, calculate, compare } = systemData.helpers;
        const { saveData, getSavedData, getData, serverFunc } = systemData;
        const { prefix } = getData();

        const user = await serverFunc('users', 'GET', { columns: ['bal'], condition: 'WHERE id=?', values: [senderID] });
        const userData = { bal: user.data[0]?.bal || '0' };
        const tttGame = (getSavedData()[threadID] || {}).tttGame;
        let challengedUserID;
        action = action.toLowerCase();

        switch (action) {
            case 'challenge':
                challengedUserID = rawArgs[1];
                let replied = false;
                if (messageReply) {
                    challengedUserID = messageReply.senderID;
                    replied = true;
                }
				
				else {
                    if (!challengedUserID) {
                        const errMsg = await addFont('⚠️ Please enter <userID or ReplyToUser> to challenge.', 'bold');
                        await send(errMsg);
                        return;
                    };
                };

                let bet = rawArgs[2];
                if (replied) bet = rawArgs[1];
				
                let userBet = await validateBet(send, bet, userData.bal);
                if (userBet === 'exit') return;
				
                userBet = getAmount(userBet, userData);

                if (tttGame?.status === 'start') {
                    const errMsg = await addFont('⚠️ There is already users playing in this thread. Please wait', 'bold');
                    await send(errMsg);
                    return;
                };

                const challengeStatus = challenge(threadID, saveData, senderID, userBet, challengedUserID);
                const userName = (await api.getUserInfo(challengedUserID)).name;

                if (challengeStatus) {
                    const inviteMsg = await addFont(`🎮 Hi ${userName} you are invited by ${messageData.name} to a TicTacToe game with bet of $${challengeStatus}`, 'serif');
                    const typeMsg = await addFont(`Type: ${prefix}TicTacToe <accept/reject>`, 'italic');
                    await send(`${inviteMsg}\n\n${typeMsg}`);
                };
				
                break;

            case 'accept':
                const savedData = getSavedData() || {};
                if (tttGame?.status!== 'pending') {
                    const errMsg = await addFont('⚠️ No pending TicTacToe game in threads.', 'bold');
                    await send(errMsg);
                    return;
                };

                challengedUserID = tttGame.challengedUserID;
                if (senderID!== challengedUserID) {
                    const errMsg = await addFont("⚠️ You can't accept because your not the challenged user.", 'bold');
                    await send(errMsg);
                    return;
                };

                const cmp = await compare(send, userData.bal, tttGame.gameBet);
                if (cmp < 0) {
                    const errMsg = await addFont('⚠️ Not enough balance to join, Game is discarded!', 'bold');
                    await send(errMsg);
                    saveData({ [threadID]: {} });
                    return;
                };

                const randomChar = str => str[Math.floor(Math.random() * str.length)];
                const randomUserIDTurn = randomChar(tttGame.players);
                const randomUserSymbol = randomChar(['X', 'Y']);

                savedData[threadID].tttGame.status = 'start';
                savedData[threadID].tttGame.gameTurn = randomUserSymbol;
                savedData[threadID].tttGame.gameTurnID = randomUserIDTurn;

                const gameBoard = await showGame(addFont, api, savedData[threadID].tttGame, send, randomUserIDTurn, randomUserSymbol, false);
                savedData[threadID].tttGame.gameBoardMessageID = gameBoard.messageID;
                savedData[threadID].tttGame.gameLastTurnTimestamp = new Date().toISOString();
                saveData(savedData);
                break;

            case 'reject':
                if (tttGame?.status!== 'pending') {
                    const errMsg = await addFont('⚠️ No pending TicTacToe game in threads.', 'bold');
                    await send(errMsg);
                    return;
                };

                challengedUserID = tttGame.challengedUserID;
                if (senderID!== challengedUserID) {
                    const errMsg = await addFont("⚠️ You can't reject because your not the challenged user.", 'bold');
                    await send(errMsg);
                    return;
                };

                saveData({ [threadID]: {} });
                const rejectMsg = await addFont('✅ Game rejected successfully.', 'bold');
                await send(rejectMsg);
                break;

            case 'play':
                if (tttGame?.status!== 'start') {
                    const errMsg = await addFont('⚠️ No pending TicTacToe game in threads.', 'bold');
                    await send(errMsg);
                    return;
                };

                const turnSymbol = tttGame.gameTurn;
                const gameTurnID = tttGame.gameTurnID;
                const players = tttGame.players;

                if (!players.includes(senderID)) {
                    const errMsg = await addFont("⚠️ You can't play because your not on active the game!", 'bold');
                    await send(errMsg);
                    return;
                };

                const turnUserName = (await api.getUserInfo(gameTurnID)).name;

                if (senderID!== gameTurnID) {
                    const errMsg = await addFont(`⚠️ Please wait for ${turnUserName}'s Turn.`, 'bold');
                    await send(errMsg);
                    return;
                };

                let placeIndex = rawArgs[1];
                if (!placeIndex) {
                    const errMsg = await addFont('⚠️ Please enter your placeIndex', 'bold');
                    await send(errMsg);
                    return;
                };

                const isDigit = str => /^\d+$/.test(str);
                if (!isDigit(placeIndex)) {
                    const errMsg = await addFont('⚠️ Enter a valid number.', 'bold');
                    await send(errMsg);
                    return;
                };

                placeIndex = Number(placeIndex) - 1;
                if (!Number.isFinite(placeIndex) || placeIndex < 0 || placeIndex > 8) {
                    const errMsg = await addFont('⚠️ Please enter a valid number from [1-9]', 'bold');
                    await send(errMsg);
                    return;
                };

                if (['✅️', '❎️'].includes(tttGame.gameSpace[placeIndex])) {
                    const errMsg = await addFont('⚠️ Space/Spot already taken!', 'bold');
                    await send(errMsg);
                    return;
                };

                await play(addFont, api, threadID, serverFunc, send, messageData, saveData, getSavedData, turnSymbol, placeIndex, { calculate, compare });
                break;

            default:
                const errMsg = await addFont('Invalid action. Actions is <challenge/accept/reject/play>', 'bold');
                await send(errMsg);
        };
    },
	
    onEvent: async function({ unsend, api, systemData, send, addFont }) {
        const { getSavedData, saveData, serverFunc } = systemData;
        const { calculate } = systemData.helpers;
        const savedData = getSavedData() || {};

        for (const [threadID, threadData] of Object.entries(savedData)) {
            if (!threadID) continue;
			
            const tttGame = threadData?.tttGame;
            if (!tttGame) continue;

            const turnID = tttGame.gameTurnID;
            const lastTurnTimestamp = tttGame?.gameLastTurnTimestamp;
			
            if (!lastTurnTimestamp) continue;

            const lastTurnMinOffset = (new Date() - new Date(lastTurnTimestamp)) / (1000 * 60);
            if (lastTurnMinOffset >= 5) {
                saveData({ [threadID]: {} });
                const loser = await serverFunc('users', 'GET', { columns: ['bal'], condition: 'WHERE id=?', values: [turnID] });
				
                const loserBal = await calculate(send, loser.data[0]?.bal || '0', 'sub', tttGame.gameBet);
                if (loserBal === 'exit') continue;

                await serverFunc('users', 'UPDATE', { columns: ['bal'], condition: 'WHERE id=?', values: [loserBal, turnID] });
                const turnUserName = (await api.getUserInfo(turnID)).name;
                const messageID = tttGame?.gameBoardMessageID;

                if (messageID) await unsend(messageID);
                const timeoutMsg = await addFont(`⚠️ A 5 min has past, But no turn received. Game has been discarded and ${turnUserName} has lose the bet.`, 'bold');
                await send(timeoutMsg, threadID, null);
            };
        };
    }
};