const ctx = require('./context.js')
const events = require('events')

class GuildHandler {
    constructor() {
        this.eventEmitter = new events.EventEmitter()

        /** @member {Map<string><GuildContext>} **/
        this.guildContexts = new Map()
    }

    /**
     *
     * @param guildId
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
     * @param {Client} client
     * @param {onJoinedCallback} callback
     */
    registerWhenToJoinListener(client, callback) {
        this.registerJoinOnJoin(client, callback)
        this.registerJoinOnMessage(client, callback)
    }

    /**
     *
     * @param {Client} client
     * @param callback
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
     * @param client
     * @param callback
     */
    registerJoinOnMessage(client, callback) {
        client.on('message', msg => {
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
    joinVoiceChannel(voiceChannel, textChannel, callback, msg = null) {
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
     * @param {string} guildId
     * @returns {string}
     */
    findPrefix(guildId) {
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