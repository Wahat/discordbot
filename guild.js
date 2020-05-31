const ctx = require('./context.js')
const events = require('events')
const config = require('./config.js')

class GuildHandler {
    /**
     *
     * @param {Client} client
     */
    constructor(client) {
        /** @member {Client} **/
        this.client = client
        this.eventEmitter = new events.EventEmitter()
        this.configHandler = new config.ConfigHandler()

        this.discordContexts = new Map()
    }

    /**
     *
     * @param {VoiceConnection} connection
     * @param {TextChannel} textChannel
     * @returns {GuildAudioContext}
     */
    getGuildContext(connection, textChannel) {
        const guild = textChannel.guild ? textChannel.guild : connection.channel.guild
        if (!this.discordContexts.has(guild.id)) {
            this.discordContexts.set(guild.id,
                new ctx.GuildContext(this.configHandler, connection, textChannel))
        }
        return this.discordContexts.get(guild.id)
    }

    /**
     *
     * @callback onJoinedCallback
     * @param {GuildContext} context
     * @param {MessageContext} msgContext
     */

    /**
     *
     * @param {onJoinedCallback} callback
     */
    registerJoinListener(callback) {
        this.registerJoinOnJoin(callback)
        this.registerJoinOnMessage(callback)
    }

    /**
     *
     * @param callback
     */
    registerJoinOnJoin(callback) {
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (!hasUserJoinedChannel(oldState, newState)) {
                this.checkIfUserLeftCurrentChannel(oldState, newState)
                return
            }
            if (isAlreadyInChannel(newState.channel, this.client.user.id)) {
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

    /**
     *
     * @param callback
     */
    registerJoinOnMessage(callback) {
        this.client.on('message', msg => {
            const prefix = this.findPrefix(msg.channel.guild)
            if (msg.author.bot || !msg.content.startsWith(prefix)) {
                return
            }
            const voiceChannel = msg.member.voice.channel;
            if (!voiceChannel) {
                msg.channel.send("You need to be in a voice channel to play music!");
                return
            }
            this.joinVoiceChannel(voiceChannel, msg.channel, callback,
                new ctx.MessageContext(msg.member.user, msg.content.replace(prefix, ''), msg.channel))
        });
    }

    /**
     *
     * @param {VoiceChannel} voiceChannel
     * @param {TextChannel} textChannel
     * @param callback
     * @param {MessageContext} msg
     */
    joinVoiceChannel(voiceChannel, textChannel, callback, msg=null) {
        voiceChannel.join().then(connection => {
            console.log(`Joining channel ${voiceChannel.name}`)
            callback(this.getGuildContext(connection, textChannel), msg)
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

module.exports.GuildHandler = GuildHandler