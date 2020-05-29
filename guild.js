const ctx = require('./context.js')

class GuildHandler {
    /**
     *
     * @param {Client} client
     */
    constructor(client) {
        /** @member {Client} **/
        this.client = client
    }

    /**
     *
     * @callback onJoinedCallback
     * @param {DiscordContext} context
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

    registerJoinOnJoin(callback) {
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (!hasUserJoinedChannel(oldState, newState) || isAlreadyInChannel(newState.channel, this.client.user.id)) {
                return
            }
            this.joinVoiceChannel(newState.channel, this.findTextChannel(newState.guild), callback)
        })
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
                new ctx.MessageContext(msg.member.user, msg.content.replace(prefix, '')))
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
            callback(new ctx.DiscordContext(connection, textChannel), msg)
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
        if (textChannel === undefined) {
            textChannel = guild.channels.cache.filter(channel => channel.type === 'text').first()
        }
        if (textChannel === undefined) {
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
                if (member.user !== undefined) {
                    if (member.user.id === botId) {
                        throw Error()
                    }
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
    return oldState.channel == null && newState.channel != null
}

module.exports.GuildHandler = GuildHandler