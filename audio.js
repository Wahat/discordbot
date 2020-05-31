const speechEngine = require('./SpeechRecognition/google.js')
const snowboy = require('./snowboy.js').Snowboy
const stream = require('stream')
const audioUtils = require('./audio_utils.js')
const ctx = require('./context.js')
const recorder = require('./recorder.js')
const embedder = require('./embedder.js')
const fs = require('fs')
const textResponder = require('./responder.js').TextResponder

class AudioHandler {
    constructor() {
        /** @member {Map<string><GuildAudioContext>} **/
        this.guilds = new Map()
        /** @member {boolean} **/
        this.isListeningToCommand = false
        this.guildsEventReceiver = null
        this.commandsEventEmitter = null
    }

    /**
     *
     * @param {GuildContext | VoiceConnectionMessageContext} context
     * @returns {GuildAudioContext}
     */
    getGuildAudioContext(context) {
        const guildId = context.getVoiceConnection().channel.guild.id
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
    reset(context) {
        this.getGuildAudioContext(context).clearAudioStreams()
        this.guilds.delete(context.getGuildId())
    }

    /**
     *
     * @param {EventEmitter} eventEmitter
     */
    registerCommandsEventEmitter(eventEmitter) {
        this.commandsEventEmitter = eventEmitter
    }

    /**
     *
     * @param {EventEmitter} eventReceiver
     */
    registerGuildsEventReceiver(eventReceiver) {
        this.guildsEventReceiver = eventReceiver
        this.guildsEventReceiver.on('userLeftChannel', (guildId, userId) => {
            const audioContext = this.guilds.get(guildId)
            if (!audioContext) {
                return
            }
            console.log(`Removing ${userId}`)
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
        if (this.guilds.has(context.getGuildId())) {
            return
        }
        this.getGuildAudioContext(context)
        connection.on('speaking', (user, speaking) => {
            if (user === undefined) {
                console.log("User is undefined")
                return
            }
            if (this.getGuildAudioContext(context).hasAudioStream(user.id) || user.bot) {
                return
            }
            console.log(`Registering ${user.tag} => ${user.id}`)
            this.startListeningToUser(context, user)
        })
        connection.on('disconnect', () => {
            console.log(`Disconnecting from ${connection.channel.guild.name}`)
            this.reset(context)
        })
    }

    /**
     *
     * @param {GuildContext} context
     * @param {User} user
     */
    startListeningToUser(context, user) {
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
            }
            this.isListeningToCommand = true
            this.commandsEventEmitter.emit('playAudioAck', context, 0)
            const recognitionStream = new stream.PassThrough()
            recorderStream.pipe(recognitionStream)
            speechEngine.runSpeechRecognition(recognitionStream, user.tag, data => {
                console.log(`${user.tag} said ${data}`)
                this.commandsEventEmitter.emit('command', context, new ctx.MessageContext(user, data.toString()))
            })
            setTimeout(() => {
                recognitionStream.end()
                this.commandsEventEmitter.emit('playAudioAck', context, 1)
                this.isListeningToCommand = false
            }, 3000)
        })
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {User} user
     * @param {string} caption
     * @param length
     */
    recordUserToFile(context, user, caption, length) {
        const audioStream = this.getGuildAudioContext(context).getAudioStream(user.id)
        if (audioStream == null) {
            console.log(`No audioStream for ${user.tag}`)
            return
        }
        const outputFile = `./clips/${user.tag}_recorded.mp3`
        audioUtils.writeStreamToMp3File(audioStream.getBuffer(), outputFile, caption, user.tag, error => {
            if (error) {
                console.log(`There was an error writing ${outputFile} to mp3: ${error.toString()}`)
                return
            }
            //TODO call responder singleton instead of context.getTextChannel()
            textResponder.respond(context, embedder.createRecordingFileEmbed(outputFile, caption, user.id), '',
                msg => {
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
     * @param {VoiceConnectionMessageContext} context
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