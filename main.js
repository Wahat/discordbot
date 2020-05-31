const Discord = require('discord.js')
const Guild = require('./guild.js').GuildHandler
const Audio = require('./audio.js')
const Command = require('./command.js')
const DJ = require('./dj.js').DJ

const client = new Discord.Client()

const keys = require('./keys.json')
const token = keys.discord_token

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            //console.log(`${channel.name} = ${channel.id}`)
        })
    })
});

client.login(token).then(result => {
    console.log(result)
});

const audioHandler = new Audio.AudioHandler()
const commandHandler = new Command.CommandHandler(DJ, audioHandler)
audioHandler.registerCommandsEventEmitter(commandHandler.eventReceiver)
audioHandler.registerGuildsEventReceiver(Guild.eventEmitter)

Guild.registerJoinListener(client, (context, msgContext) => {
    audioHandler.registerConnection(context)
    if (msgContext != null) {
        commandHandler.eventReceiver.emit('command', context, msgContext)
    }
})
