const Discord = require('discord.js')
const Guild = require('./guild.js').GuildHandler
const Audio = require('./audio.js')
const Command = require('./command.js')
const DJ = require('./dj.js').DJHandler
const keys = require('./keys.js').Key

const client = new Discord.Client()

client.login(keys.get("discord_token")).then(result => {
    console.log(`Logged in!`)
});

client.on('invalidated', () => {
    console.log('Session invalidated')
})

setInterval(() => {
    console.log(`HeapTotal: ${process.memoryUsage().heapTotal / 1000000} HeapUsed: ${process.memoryUsage().heapUsed / 1000000} External: ${process.memoryUsage().external / 1000000} RSS: ${process.memoryUsage().rss / 1000000}`)
}, 30000);

const audioHandler = new Audio.AudioHandler()
const commandHandler = new Command.CommandHandler(DJ, audioHandler)
audioHandler.registerCommandsEventEmitter(commandHandler.eventReceiver)
audioHandler.registerGuildsEventReceiver(Guild.eventEmitter)

Guild.registerWhenToJoinListener(client, (context, msgContext) => {
    audioHandler.registerConnection(context)
    if (msgContext != null) {
        commandHandler.eventReceiver.emit('command', msgContext)
    }
})
