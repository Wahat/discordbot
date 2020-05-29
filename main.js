const Discord = require('discord.js')
const Guild = require('./guild.js')
const Audio = require('./audio.js')
const Command = require('./command.js')

const client = new Discord.Client()
const token = 'NzEzMjA3NjExNjUwMjExOTE0.Xsc1FA.6BGjUq7zFOoZPSU6TEh2XEN_5iQ'

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
const commandHandler = new Command.CommandHandler(client)
const audioHandler = new Audio.AudioHandler()
audioHandler.registerEventBus(commandHandler.eventBus)

guildHandler.registerJoinListener((context, msgContext) => {
    audioHandler.registerConnection(context)
    if (msgContext != null) {
        commandHandler.eventBus.emit('command', context, msgContext)
    }
})
