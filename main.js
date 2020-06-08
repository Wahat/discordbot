const Discord = require('discord.js')
const Guild = require('./guild.js').GuildHandler
const Audio = require('./audio.js')
const Command = require('./command.js')
const DJ = require('./dj.js').DJHandler

const client = new Discord.Client()

const keys = require('./keys.js').Key

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            //console.log(`${channel.name} = ${channel.id}`)
        })
    })
});

client.login(keys.get("discord_token")).then(result => {
    //console.log(result)
});

client.on('invalidated', () => {
    console.log('Session invalidated')
})

const audioHandler = new Audio.AudioHandler()
const commandHandler = new Command.CommandHandler(DJ, audioHandler)
audioHandler.registerCommandsEventEmitter(commandHandler.eventReceiver)
audioHandler.registerGuildsEventReceiver(Guild.eventEmitter)

Guild.registerWhenToJoinListener(client, (context, msgContext) => {
    audioHandler.registerConnection(context)
    if (msgContext != null) {
        commandHandler.eventReceiver.emit('command', context, msgContext)
    }
})
