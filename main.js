constDiscord=require('discord.js')
constGuild=require('./guild.js').GuildHandler
constAudio=require('./audio.js')
constCommand=require('./command.js')
constDJ=require('./dj.js').DJHandler
constkeys=require('./keys.js').Key

constclient=newDiscord.Client()

client.login(keys.get("discord_token")).then(result=>{
console.log(`Loggedin!`)
});

client.on('invalidated',()=>{
console.log('Sessioninvalidated')
})

setInterval(()=>{
console.log(`HeapTotal:${process.memoryUsage().heapTotal/1000000}HeapUsed:${process.memoryUsage().heapUsed/1000000}External:${process.memoryUsage().external/1000000}RSS:${process.memoryUsage().rss/1000000}`)
},30000);

constaudioHandler=newAudio.AudioHandler()
constcommandHandler=newCommand.CommandHandler(DJ,audioHandler)
audioHandler.registerCommandsEventEmitter(commandHandler.eventReceiver)
audioHandler.registerGuildsEventReceiver(Guild.eventEmitter)

Guild.registerWhenToJoinListener(client,(context,msgContext)=>{
audioHandler.registerConnection(context)
if(msgContext!=null){
commandHandler.eventReceiver.emit('command',msgContext)
}
})
