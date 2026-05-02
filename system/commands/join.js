const showThreads = async (send, groupChats, saveData, addFont) => {
    let groupsBody = "📮 Group Chats:\n";
    if (!groupChats.length) {
        const noneText = await addFont('[None]', 'italic');
        groupsBody += `— ${noneText}`;
    }
	
	else {
        for (let i = 0; i < groupChats.length; i++) {
            const gc = groupChats[i];
            const nameText = await addFont(gc.name, 'bold');
            groupsBody += `— ${i + 1}. ${nameText} (${gc.participantIDs.length} members)\n`;
        };
		
        const usageText = await addFont('Usage: Join <number>', 'italic');
        groupsBody += `\n${usageText}`;
    };
	
    await send(groupsBody);
    saveData({ groupChats });
};


module.exports = {
    config: {
        name: 'Join',
        description: 'Join bot group chat.',
        usage: '[prefix]Join <index>',
        author: 'Prince',
        role: 3,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ api, rawArgs, send, systemData, messageData, addFont }) {
        const { senderID } = messageData;
        const { helpers, getSavedData, saveData } = systemData;
        const { validateBet, getAmount } = helpers;

        const savedData = getSavedData();
        const threads = await api.getThreadList(20, null, 'INBOX');
        let groupChats = threads.filter(thread => thread.isGroup);
        groupChats = savedData.groupChats || groupChats;

        let index = rawArgs[0];
        if (!index) {
            await showThreads(send, groupChats, saveData, addFont);
            return;
        };

        if (!groupChats.length) {
            const errMsg = await addFont('No group chats available.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        index = await validateBet(send, index, groupChats.length, 'index', 'index');
        if (index === 'exit') return;
        index -= 1;

        const targetGroup = groupChats[index];
        const targetID = targetGroup.threadID;
        const targetParticipants = targetGroup.participantIDs;

        if (targetParticipants.includes(senderID)) {
            const errMsg = await addFont(`You're already a member of "${targetGroup.name}".`, 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        const addingText = await addFont(`Adding you to "${targetGroup.name}"...`, 'italic');
        await send(`⏳ ${addingText}`);

        api.addUserToGroup(senderID, targetID, async (err) => {
            if (err) {
                console.error("addUserToGroup:", err);
                if (err.errorSummary) {
                    const errMsg = await addFont(`Failed: ${err.errorSummary}`, 'bold');
                    await send(`⚠️ ${errMsg}`);
                }
				
				else {
                    const errMsg = await addFont('An error occurred. The bot might not be an admin or your privacy settings block adds.', 'bold');
                    await send(`⚠️ ${errMsg}`);
                };
				
                return;
            };
			
            const successMsg = await addFont(`Successfully joined "${targetGroup.name}"!`, 'bold');
            await send(`✅️ ${successMsg}`);
        });
    }
};