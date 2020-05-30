const Discord = require('discord.js')
const Guild = require('./guild.js')
const Audio = require('./audio.js')
const Command = require('./command.js')
const DJ = require('./dj.js')

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

const guildHandler = new Guild.GuildHandler(client)
const audioHandler = new Audio.AudioHandler()
const dj = new DJ.DJ()
const commandHandler = new Command.CommandHandler(dj, audioHandler)
audioHandler.registerCommandsEventEmitter(commandHandler.eventReceiver)
audioHandler.registerGuildsEventReceiver(guildHandler.eventEmitter)

client.on('guildMemberSpeaking', (user, speaking) => {
    console.log("someone speaking")
})

guildHandler.registerJoinListener((context, msgContext) => {
    audioHandler.registerConnection(context)
    if (msgContext != null) {
        commandHandler.eventReceiver.emit('command', context, msgContext)
    }
})
