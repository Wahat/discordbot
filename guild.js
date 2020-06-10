const ctx = require('./context.js')
const events = require('events')
const configHandler = require('./config.js').ConfigHandler
const dmHandler = require('./dm.js').DMHandler
const commandConfig = require('./commands_config.json')

class GuildHandler {
    constructor() {
        this.eventEmitter = new events.EventEmitter()

        /** @member {Map<string><GuildContext>} **/
        this.guildContexts = new Map()
    }

    /**
     *
     * @param {string} guildId
     * @returns {GuildContext | null}
     */
    getGuildContextFromId(guildId) {
        return this.guildContexts.get(guildId)
    }

    /**
     *
     * @param {VoiceConnection} connection
     * @param {TextChannel} textChannel
     * @returns {GuildContext}
     */
    getGuildContext(connection, textChannel) {
        const guild = textChannel.guild ? textChannel.guild : connection.channel.guild
        if (!this.guildContexts.has(guild.id)) {
            this.guildContexts.set(guild.id,
                new ctx.GuildContext(connection, textChannel))
        }
        // Update guild context if different channel / new voice connection
        const guildContext = this.guildContexts.get(guild.id)
        if (guildContext.getTextChannel() !== textChannel ||
            connection && guildContext.getVoiceConnection() !== connection) {
            this.guildContexts.set(guild.id, new ctx.GuildContext(connection, textChannel))
        }
        return this.guildContexts.get(guild.id)
    }

    /**
     *
     * @callback onJoinedCallback
     * @param {GuildContext} context
     * @param {MessageContext} msgContext
     */

    /**
     *
     * @param {module:"discord.js".Client} client
     * @param {onJoinedCallback} callback
     */
    registerWhenToJoinListener(client, callback) {
        this.registerJoinOnJoin(client, callback)
        this.registerJoinOnMessage(client, callback)
    }

    /**
     *
     * @param {module:"discord.js".Client} client
     * @param {onJoinedCallback} callback
     */
    registerJoinOnJoin(client, callback) {
        client.on('voiceStateUpdate', (oldState, newState) => {
            if (!hasUserJoinedChannel(oldState, newState)) {
                this.checkIfUserLeftCurrentChannel(oldState, newState)
                return
            }
            if (isAlreadyInChannel(newState.channel, client.user.id)) {
                this.checkIfUserJoinedCurrentChannel(oldState, newState)
                return
            }
            this.joinVoiceChannel(newState.channel, this.findTextChannel(newState.guild), callback)
        })
    }

    /**
     *
     * @param {VoiceState} oldState
     * @param {VoiceState} newState
     */
    checkIfUserLeftCurrentChannel(oldState, newState) {
        if (oldState.channel && !newState.channel) {
            this.eventEmitter.emit('userLeftChannel', oldState.guild.id, oldState.member.user.id)
        }
    }

    checkIfUserJoinedCurrentChannel(oldState, newState) {
        if (hasUserJoinedChannel(oldState, newState)) {
            this.eventEmitter.emit('userJoinedChannel', newState)
        }
    }

    /**
     *
     * @param {module:"discord.js".Client} client
     * @param {onJoinedCallback} callback
     */
    registerJoinOnMessage(client, callback) {
        client.on('message', /** @type {Message} **/ msg => {
            if (msg.channel.type !== "text") {
                if (msg.channel.type === "dm") {
                    dmHandler.onMessageReceived(client, msg)
                }
                return
            }
            const prefix = this.findPrefix(msg.channel.guild)
            if (msg.author.bot || !msg.content.startsWith(prefix)) {
                return
            }
            const voiceChannel = msg.member.voice.channel;
            const aliasedCommand = msg.content.replace(prefix, '').split(' ')[0]
            const guildConfig = configHandler.retrieveConfig(msg.channel.guild.id)
            const actualCommand = guildConfig["aliases"][aliasedCommand] ? guildConfig["aliases"][aliasedCommand] : aliasedCommand
            if (!commandConfig["commands"][actualCommand]) {
                msg.channel.send('Not a valid command')
                return
            }
            if (!voiceChannel && commandConfig["commands"][actualCommand]["type"] === 'voice') {
                msg.channel.send('You need to be in a voice channel to play music!')
                return
            }
            const msgContext = new ctx.MessageContext(msg.member.user,
                msg.content.replace(prefix, '').replace(aliasedCommand, actualCommand), msg.channel, msg)
            if (commandConfig["commands"][actualCommand]["type"] !== 'voice') {
                callback(this.getGuildContext(null, msg.channel), msgContext)
                return
            }
            this.joinVoiceChannel(voiceChannel, msg.channel, callback, msgContext)
        });
    }

    /**
     *
     * @param {VoiceChannel} voiceChannel
     * @param {TextChannel} textChannel
     * @param callback
     * @param {MessageContext} msgContext
     */
    joinVoiceChannel(voiceChannel, textChannel, callback, msgContext = null) {
        voiceChannel.join().then(connection => {
            if (msgContext) {
                msgContext.voiceConnection = connection
            }
            callback(this.getGuildContext(connection, textChannel), msgContext)
        })
    }

    /**
     *
     * @param {Guild} guild
     * @returns {TextChannel}
     */
    findTextChannel(guild) {
        const desiredChannel = ""
        let textChannel = guild.channels.cache.filter(channel => channel.type === 'text')
            .find(channel => channel.name === desiredChannel)
        if (!textChannel) {
            textChannel = guild.channels.cache.filter(channel => channel.type === 'text').first()
        }
        if (!textChannel) {
            console.log(`No text channel found for ${guild.name}`)
        }
        return textChannel
    }

    /**
     *
     * @param {Guild} guild
     * @returns {string}
     */
    findPrefix(guild) {
        return '?'
    }
}

/**
 *
 * @param {VoiceChannel} channel
 * @param {string} botId
 * @returns {boolean}
 */
function isAlreadyInChannel(channel, botId) {
    try {
        channel.guild.channels.cache.filter(channel => channel.type === 'voice').forEach(channel => {
            channel.members.forEach(member => {
                if (member.user && member.user.id === botId) {
                    throw Error()
                }
            })
        })
    } catch {
        return true
    }
    return false
}

/**
 *
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 * @returns {boolean}
 */
function hasUserJoinedChannel(oldState, newState) {
    return !oldState.channel && newState.channel
}

module.exports.GuildHandler = new GuildHandler()