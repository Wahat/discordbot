const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const python = require('./python')
const snowboy = require('./snowboy.js')
const stream = require('stream')

const wav = require('wav')
const ctx = require('./context.js')
require('events')

ffmpeg.setFfmpegPath(ffmpegPath);

class AudioHandler {
    constructor() {
        /** @member {Map} **/
        this.connections = new Map()
        /** @member {Map} **/
        this.audioStreams = new Map()
        this.detector = new snowboy.Snowboy()

        this.listeningToCommand = false
    }

    /**
     *
     * @param {EventEmitter} eventBus
     */
    registerEventBus(eventBus) {
        this.eventBus = eventBus
    }

    /**
     *
     * @param {DiscordContext} context
     */
    registerConnection(context) {
        const connection = context.getVoiceConnection()
        if (this.connections.has(context.getGuildId())) {
            return
        }
        this.connections.set(context.getGuildId(), context)
        connection.on('speaking', (user, speaking) => {
            if (user === undefined) {
                console.log("User is undefined")
                return
            }
            if (this.audioStreams.has(user.tag) || user.bot) {
                return
            }
            console.log(`Registering ${user.tag}`)
            this.startListeningToUser(context, user)
        })
        connection.on('disconnect', () => {
            console.log(`Disconnecting from ${connection.channel.guild.name}`)
            this.connections.delete(context.getGuildId())
        })
    }

    /**
     *
     * @param {DiscordContext} context
     * @param user
     */
    startListeningToUser(context, user) {
        const connection = context.getVoiceConnection()
        let audio = connection.receiver.createStream(user, {
            mode: 'pcm',
            end: 'manual'
        })
        this.audioStreams.set(user.tag, audio)
        this.detector.recognize(user.tag, audio, (trigger) => {
            if (this.listeningToCommand) {
                console.log('Already listening for a command')
            }
            this.listeningToCommand = true
            this.eventBus.emit('playAudioAck', context, 0)
            const recordStream = new stream.PassThrough()
            audio.pipe(recordStream)
            const outputFile = `/Users/henryxu/Documents/WebstormProjects/discordbot/clips/${user.tag}.wav`
            const wavWriter = new wav.FileWriter(`${outputFile}`, {
                "channels": 2,
                "sampleRate": 48000,
                "bitDepth": 16
            })
            recordStream.pipe(wavWriter)
            recordStream.on('end', () => {
                console.log("Finished recording")
                python.runSpeechRecognition(`${outputFile}`, data => {
                    console.log(`${user.tag} said ${data}`)
                    this.eventBus.emit('command', context, new ctx.MessageContext(user, data.toString()))
                })
            })
            setTimeout(() => {
                recordStream.end()
                this.eventBus.emit('playAudioAck', context, 1)
                this.listeningToCommand = false
            }, 3000)
        })
    }
}

module.exports.AudioHandler = AudioHandler