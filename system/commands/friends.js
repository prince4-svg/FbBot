module.exports = {
    config: {
        name: 'Friends',
        description: 'See all bots friends',
        usage: '[prefix]Friends',
        author: 'Prince',
        role: 3,
        coolDown: 5,
        aliases: []
    },
	
    onStart: async function({ api, send, addFont }) {
        const friendsData = await api.friendList();
        const { friends, friendCount } = friendsData;

        const title = await addFont('Friends:', 'bold');
        let friendsBody = `📑 ${title}\n`;

        if (!friends.length) {
            const noneText = await addFont('[None]', 'italic');
            friendsBody += `— ${noneText}`;
        }
		
		else {
            for (const friend of friends) {
                friendsBody += `— ${friend.name}\n`;
            };
        };

        const countText = await addFont(`Count: ${friendCount}`, 'italic');
        friendsBody += `\n📍 ${countText}`;
		
        await send(friendsBody);
	}
};