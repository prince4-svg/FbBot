module.exports = {
    config: {
        name: 'ChatOFF',
        description: 'Toggle ChatOFF mode',
        usage: '[prefix]ChatOFF <on/off>',
        author: 'Prince',
        role: 2,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ rawArgs, api, botID, systemData, messageData, send, addFont }) {
        const { senderID, threadID } = messageData;
        const { saveData, getData } = systemData;
        const { getThreadInfo } = api;

        let action = rawArgs[0];
        if (!action) {
            const errMsg = await addFont('Enter your action.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        action = action.toLowerCase();
        if (!['on', 'off'].includes(action)) {
            const errMsg = await addFont('Invalid action.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        const threadInfo = await getThreadInfo(threadID);
        let { adminIDs } = threadInfo;
        const { admins } = getData();
        adminIDs = adminIDs.map(admin => admin.id);

        if (!adminIDs.includes(botID)) {
            const errMsg = await addFont('Bot needs to be admin first.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        saveData({ [threadID]: { ChatOFF: action === 'on' } });
        const msgText = action === 'on'? 'Enabled. Auto kick users.' : 'Disabled. Users can now message.';
        const msg = await addFont(msgText, 'bold');
        const emoji = action === 'on'? '🔐' : '🔓';
        await send(`${emoji} | ${msg}`);
    },

    onMessage: async function({ api, messageData, systemData, botID, send, addFont }) {
        const { threadID, senderID } = messageData;
        const { getSavedData, getData } = systemData;
        const { getThreadInfo, removeUserFromGroup } = api;

        const savedData = getSavedData() || {};
        if (!savedData[threadID]?.ChatOFF) return;

        let { adminIDs } = await getThreadInfo(threadID);
        const { admins } = getData();
        adminIDs = adminIDs.map(admin => admin.id);

        if (!adminIDs.includes(botID)) {
            const errMsg = await addFont('Bot is not admin.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        if (!adminIDs.includes(senderID) &&!admins.includes(senderID)) {
            await removeUserFromGroup(senderID, threadID);
            return 'exit';
        };
    }
};