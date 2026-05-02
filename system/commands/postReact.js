const reactionsMap = {
	unlike: 0,
    like: 1,
    heart: 2,
    love: 16,
    haha: 4,
    wow: 3,
    sad: 7,
    angry: 8,
};


const reactions = Object.keys(reactionsMap);


module.exports = {
    config: {
        name: 'PostReact',
        description: 'React to a post.',
        usage: `[prefix]PostReact <${(reactions).join('/')}> <postID>`,
        author: 'Prince',
        role: 0,
        coolDown: 5,
        aliases: ['react']    
    },
    
    onStart: async function({ rawArgs, send, api }) {
		let [reaction, postID] = rawArgs;
		
		if (!reaction) {
			await send('⚠️ Enter reaction to perform.');
			return;
		};
		
		if (!postID) {
			await send('⚠️ Enter post id to react with.');
			return;
		};
		
		reaction = reaction.toLowerCase();
		if (!reactions.includes(reaction)) {
			await send('⚠️ Invalid reaction.');
			return;
		};
		
		const reactionID = reactionsMap[reaction];
		api.setPostReaction(postID, reactionID, async (err, data) => {
			if (err) {
				console.log(err);
				await send('⚠️ Unknown error occurred');
				return;
			};
			
			await send('✅️ React sent successfully');
		});
    }
};