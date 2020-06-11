const speechEngine = require('./SpeechRecognition/microsoft.js')
const snowboy = require('./snowboy.js').Snowboy
const stream = require('stream')
const audioUtils = require('./audio_utils.js')
const ctx = require('./context.js')
const recorder = require('./recorder.js')
const embedder = require('./embedder.js').Embedder
const fs = require('fs')
const textResponder = require('./responder.js').TextResponder
const guild = require('./guild.js').GuildHandler

class AudioHandler {
    constructor() {
        /** @member {Map<string><GuildAudioContext>} **/
        this.guilds = new Map()
        /** @member {Map<string><number>} **/
        this.recentlyRemoved = new Map()
        /** @member {boolean} **/
        this.isListeningToCommand = false
        /** @member {EventEmitter | module:events.internal.EventEmitter} **/
        this.guildsEventReceiver = undefined
        /** @member {EventEmitter | module:events.internal.EventEmitter} **/
        this.commandsEventEmitter = undefined
    }

    /**
     *
     * @param {GuildContext | MessageContext} context
     * @returns {GuildAudioContext}
     */
    getGuildAudioContext(context) {
        const guildId = context.getGuild().id
        if (!this.guilds.has(guildId)) {
            console.log(`Missing audio context for ${guildId}`)
            this.guilds.set(guildId, new ctx.GuildAudioContext())
        }
        return this.guilds.get(guildId)
    }

    /**
     *
     * @param {GuildContext} context
     */
    resetGuild(context) {
        this.getGuildAudioContext(context).clearAudioStreams()
        snowboy.clearDetectors()
        this.guilds.delete(context.getGuild().id)
    }

    /**
     *
     * @param {EventEmitter | module:events.internal.EventEmitter} eventEmitter
     */
    registerCommandsEventEmitter(eventEmitter) {
        this.commandsEventEmitter = eventEmitter
    }

    /**
     *
     * @param {EventEmitter | module:events.internal.EventEmitter} eventReceiver
     */
    registerGuildsEventReceiver(eventReceiver) {
        this.guildsEventReceiver = eventReceiver
        this.guildsEventReceiver.on('userLeftChannel', (guildId, userId) => {
            const context = guild.getGuildContextFromId(guildId)
            if (!context) {
                return
            }
            const audioContext = this.getGuildAudioContext(context)
            console.log(`Removing ${userId}`)
            this.recentlyRemoved.set(userId, Date.now())
            audioContext.removeAudioStream(userId)
            snowboy.remove(guildId, userId)
        })
    }

    /**
     *
     * @param {GuildContext} context
     */
    registerConnection(context) {
        const connection = context.getVoiceConnection()
        if (this.guilds.has(context.getGuild().id) || !connection) {
            return
        }
        audioUtils.playSilentAudioStream(connection)
        this.getGuildAudioContext(context) // Create the audio context
        connection.on('speaking', (user, speaking) => {
            if (user === undefined) {
                console.log("User is undefined")
                return
            }
            if (this.getGuildAudioContext(context).hasAudioStream(user.id) || user.bot) {
                return
            }
            if (this.recentlyRemoved.has(user.id)) {
                console.log(`time difference ${Date.now() - this.recentlyRemoved.get(user.id)}`)
            }
            if (this.recentlyRemoved.has(user.id) && (Date.now() - this.recentlyRemoved.get(user.id)) < 300) {
                this.recentlyRemoved.delete(user.id)
                return
            }
            this.startListeningToUser(context, user)
        })

        connection.on('ready', () => {
            console.log('Connection ready')
        })

        connection.on('newSession', () => {
            console.log('New Session')
        })

        connection.on('warning', warning => {
            console.log(`Warning: ${warning}`)
        })

        connection.on('error', err => {
            console.log(`Error: ${err.name}, ${err.message}`)
        })

        connection.on('reconnecting', () => {
            console.log('Reconnecting')
        })

        connection.on('disconnect', () => {
            console.log(`Disconnecting from ${connection.channel.guild.name}`)
            this.resetGuild(context)
        })
    }

    /**
     *
     * @param {GuildContext} context
     * @param {User} user
     */
    startListeningToUser(context, user) {
        console.log(`Registering ${user.tag} => ${user.id}`)
        const connection = context.getVoiceConnection()
        let audio = connection.receiver.createStream(user, {
            mode: 'pcm',
            end: 'manual'
        })
        const recorderStream = new recorder.Recorder()
        audio.pipe(recorderStream)
        this.getGuildAudioContext(context).setAudioStream(user.id, recorderStream)
        snowboy.recognize(context, user.id, recorderStream, (trigger) => {
            if (this.isListeningToCommand) {
                console.log('Already listening for a command')
                return
            }
            this.isListeningToCommand = true
            this.commandsEventEmitter.emit('playHotwordAudioAck', context, 0)
            const recognitionStream = new stream.PassThrough()
            recorderStream.pipe(recognitionStream)
            speechEngine.runSpeechRecognition(recognitionStream, user.tag, data => {
                console.log(`${user.tag} said ${data}`)
                this.commandsEventEmitter.emit('command', new ctx.MessageContext(user, data.toString(),
                    context.getTextChannel(), null, connection))
            })
            setTimeout(() => {
                recognitionStream.end()
                recognitionStream.destroy()
                this.commandsEventEmitter.emit('playHotwordAudioAck', context, 1)
                this.isListeningToCommand = false
            }, 3000)
        })
    }

    /**
     *
     * @param {MessageContext} context
     * @param {User} user
     * @param {string} caption
     * @param length
     * @param {boolean} transcribe
     */
    recordUserToFile(context, user, caption = "Clip", length = 0, transcribe = false) {
        const audioStream = this.getGuildAudioContext(context).getAudioStream(user.id)
        if (audioStream == null) {
            console.log(`No audioStream for ${user.tag}`)
            return
        }
        const outputFile = `./clips/${user.tag}_recorded.mp3`
        audioUtils.writeStreamToMp3File(audioStream.getBuffer(), outputFile, caption, user.tag, err => {
            if (err) {
                console.log(`There was an error writing ${outputFile} to mp3: ${err.toString()}`)
                return
            }
            textResponder.respond(context, embedder.createRecordingFileEmbed(outputFile, caption, user.id), '', msg => {
                fs.unlink(outputFile, error => {
                    if (error) {
                        console.log(`There was an error deleting ${outputFile}`)
                    }
                })
            })
        })
    }

    /**
     *
     * @param {MessageContext} context
     * @param {User} user
     * @param length
     */
    replayUser(context, user, length) {
        const audioStream = this.getGuildAudioContext(context).getAudioStream(user.id)
        if (audioStream == null) {
            console.log(`No audioStream for ${user.tag}`)
            return
        }
        this.commandsEventEmitter.emit('playAudioWavStream', context, audioStream.getRecordedStream())
    }
}

module.exports.AudioHandler = AudioHandler