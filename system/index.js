const login = require('stfca');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
const { addFont, origLog } = require('./data');
const system = require('./data').systemData;


const { getSavedData, serverFunc } = system;


//origLog.log(chalk.green('\n\n[BOT]'));
//origLog.info(util.inspect(system.getData(), { depth: 2, indent: 4 }), '\n');


origLog.log(chalk.green('\n[SYSTEM]'));
origLog.info(util.inspect(system, { depth: 1, indent: 4 }), '\n');


const startData = system.getData();
const commandsConfig = startData.commandsConfig;
const specialCallsAndInvalids = startData.specialCallsAndInvalids;
let messageHistory = {};


async function runFunc(runner, data, type = 'sync') {
    try {
        if (type == 'sync') {
            return runner(data);
        } 
        
        else if (type == 'async') {
            return await runner(data);
        };
        
    } 
    
    catch (err) {
        origLog.log(`[ RUN ]: ${err.stack}`);
    };
};


function run(appstatePath = null, systemData=system) {
    try {
		systemData.run = run;
		
		if (!appstatePath) {
        	appstatePath = path.join(__dirname, 'appstates/main-bot.json');
		};	
		
		login({ appState: JSON.parse(fs.readFileSync(appstatePath, 'utf8')) }, (err, api) => {
            if (err) return console.error(err);
            
            api.setOptions({
                listenEvents: true,
                selfListen: true,
                listenTyping: true,
                updatePresence: true
            });
			
			const realGetUserInfo = api.getUserInfo;
			api.getUserInfo = async (id) => {
				if (!id) return;
				
				return (await realGetUserInfo(id))[id];
			};
			
            api.listenMqtt(async (err, event) => {
                const message = event;
                const botID = await api.getCurrentUserID();
                const { senderID, threadID } = message;
				
				if (senderID === botID) return;

                event.type == 'event' ? (origLog.info(`\n${chalk.green('[EVENT]')}`), origLog.log(util.inspect(event, { depth: 2 }), '\n')) : null;

                const messageData = message;
                
                if (!(threadID in messageHistory)) {
                    messageHistory[threadID] = [];
                };
                
                messageHistory[threadID].push(messageData)

                const botData = systemData.getData();
                const { prefix, admins } = botData;

				async function send(msg, targetThreadID = threadID, replyToId = messageData?.messageID ?? null, isSingleUser=false, font = false, callback = () => {}) {
					if (typeof msg === "string") msg = { body: msg };
					
					msg.body = String(msg?.body ?? "");
					targetThreadID = String(targetThreadID);
					const reply = replyToId ? String(replyToId) : null;
  
					if (font) {
						msg.body = await addFont(msg?.body);
					};
  
					return await api.sendMessage(msg, targetThreadID, callback, reply, isSingleUser);
				};

                const unsend = async (messageID) => await api.unsendMessage(messageID);
                const react = async (reaction, target = messageData.messageID) => await api.setMessageReaction(reaction, target);

                if (!['message', 'message_reply'].includes(messageData.type)) {
                    if (messageData.type == 'message_unsend') {
                        let onUnsendData = {
                            send,
                            unsend,
                            react,
                            systemData,
                            api,
                            messageData,
                            origLog,
                            botID,
                            addFont
                        };
                        try {
                            const unsendInfo = messageHistory[messageData.threadID].find(msg => msg.messageID == messageData.messageID) || {};
                            onUnsendData.unsendInfo = unsendInfo;
                        } 
                        
                        catch (err) {
                            onUnsendData.unsendInfo = {};
                            origLog.log(`onUnsend: ${err.message}`);
                        };
                        
                        for (const onUnsendFunc of specialCallsAndInvalids.onUnsends) {
                            if (onUnsendFunc.constructor.name === 'AsyncFunction') {
                                await runFunc(onUnsendFunc, onUnsendData, 'async');
                            }
                            
                            else {
                                runFunc(onUnsendFunc, onUnsendData);
                            };
                        };
                        
                    } 
                    
                    else if (['event', 'typ'].includes(event.type)) {
                        const onEventData = {
                            event,
                            send,
                            unsend,
                            react,
                            systemData,
                            api,
                            origLog,
                            botID,
                            addFont
                        };
                        for (const onEventFunc of specialCallsAndInvalids.onEvents) {
                            if (onEventFunc.constructor.name === 'AsyncFunction') {
                                await runFunc(onEventFunc, onEventData, 'async');
                            } 
                            
                            else {
                                runFunc(onEventFunc, onEventData);
                            };
                        };
                    };
                    
                    return;
                };

                const text = typeof message === 'string' ? message : (message?.body ?? '');
                const messageContent = text.split(' ');
                const rawArgs = messageContent.slice(1);
                const onMessageData = {
                    rawArgs,
                    messageData,
                    systemData,
                    send,
                    unsend,
                    react,
                    api,
                    botID,
                    origLog,
                    addFont
                };

                for (const onMessageFunc of specialCallsAndInvalids.onMessages) {
                    let result;
                    if (onMessageFunc.constructor.name === 'AsyncFunction') {
                        result = (await runFunc(onMessageFunc, onMessageData, 'async'));
                    } 
                    
                    else {
                        result = (runFunc(onMessageFunc, onMessageData));
                    };
                    
                    if (result === 'exit') return;
                };

                if (!(messageContent.length)) {
                    return;
                };
                
                
                let targetCommand = messageContent[0].toLowerCase();
                if (!(targetCommand.startsWith(prefix))) {
                    return;
                };                                
                
                const fromSavedTargetCmd = getSavedData().targetCmd;
                
                targetCommand = fromSavedTargetCmd || targetCommand.slice(prefix.length);
                if (!(targetCommand in commandsConfig)) {
                    return await send('⚠️ Unkown command.');
                };

                const onStartData = {
                    rawArgs,
                    messageData,
                    api,
                    systemData,
                    send,
                    unsend,
                    react,
                    botID,
                    origLog,
                    addFont
                };
                
                const onStartFunc = commandsConfig[targetCommand].onStart;
                if (onStartFunc.constructor.name === 'AsyncFunction') {
                    await runFunc(onStartFunc, onStartData, 'async');
                } 
                
                else {
                    runFunc(onStartFunc, onStartData);
                };
            });
        });
    } 
    
    catch (err) {
        try {
            origLog.log(`\n${chalk.red('[LOG]')}\n${err}`);
        } 
        
        catch (err) {};
    };
};


run();
