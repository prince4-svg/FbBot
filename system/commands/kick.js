module.exports = {
    config: {
        name: 'Kick',
        description: 'Remove user/users from chat box.',
        usage: '[prefix]Kick <replyToUser or mention [multiple] works for both <combined or not>',
        author: 'Prince',
        role: 2,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ messageData, systemData, api, send, botID, addFont }) {
        const { senderID, threadID, messageReply, mentions, participantIDs } = messageData;
        const { getThreadInfo } = api;
        const { admins } = systemData.getData();

        const threadInfo = await getThreadInfo(threadID);
        let { adminIDs } = threadInfo;
        adminIDs = adminIDs.map(obj => obj.id);

        if (!adminIDs.includes(botID)) {
            const errMsg = await addFont('Bot needs to be admin to kick users.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };

        const mentionIDs = Object.keys(mentions);
        let targetIDs = mentionIDs || [];
        if (messageReply) {
            targetIDs.push(messageReply.senderID);
        };

        if (!targetIDs.length) {
            const errMsg = await addFont('Please reply to user or mention or do both.', 'bold');
            await send(`⚠️ ${errMsg}`);
            return;
        };
		
		targetIDs = [...new Set(targetIDs)];

        let removedLength = 0;
        let removedInfo = "\n\n";
		
        const headerText = await addFont('Removed users:', 'italic');
        removedInfo += `💁‍♂️ ${headerText}\n`;

        for (const targetID of targetIDs) {
            if (!participantIDs.includes(targetID)) {
                continue;
            };
			
            const targetName = (await api.getUserInfo(targetID)).name;
            await api.removeUserFromGroup(targetID, threadID);
            removedLength++;
            removedInfo += `— ${targetName}\n`;
        }

        const countText = await addFont(`Successfully removed ${removedLength} user${removedLength > 1? 's' : ''} from chat box.`, 'bold');
        await send(`✅️ ${countText}${removedInfo}`);
    }
};