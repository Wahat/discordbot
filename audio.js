const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const python = require('./python.js')
const snowboy = require('./snowboy.js')
const stream = require('stream')
const lame = require('node-lame')

const wav = require('wav')
const ctx = require('./context.js')
const recorder = require('./recorder.js')
const embedder = require('./embedder.js')
const fs = require('fs')
require('events')

ffmpeg.setFfmpegPath(ffmpegPath);

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
            this.guilds.set(guildId, new ctx.GuildAudioContext(new snowboy.Snowboy()))
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
            audioContext.getDetector().remove(userId)
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
        this.getGuildAudioContext(context).getDetector().recognize(user.id, recorderStream, (trigger) => {
            if (this.isListeningToCommand) {
                console.log('Already listening for a command')
            }
            this.isListeningToCommand = true
            this.commandsEventEmitter.emit('playAudioAck', context, 0)
            const recognitionStream = new stream.PassThrough()
            recorderStream.pipe(recognitionStream)
            const outputFile = `/Users/henryxu/Documents/WebstormProjects/discordbot/clips/${user.tag}.wav`
            writeStreamToWavFile(recognitionStream, outputFile)
            recognitionStream.on('end', () => {
                console.log("Finished recording")
                python.runSpeechRecognition(`${outputFile}`, data => {
                    console.log(`${user.tag} said ${data}`)
                    this.commandsEventEmitter.emit('command', context, new ctx.MessageContext(user, data.toString()))
                })
            })
            setTimeout(() => {
                recognitionStream.end()
                recognitionStream.destroy()
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
        const outputFile = `/Users/henryxu/Documents/WebstormProjects/discordbot/clips/${user.tag}_recorded.mp3`
        writeStreamToMp3File(audioStream.getBuffer(), outputFile, caption, user.tag, error => {
            if (error) {
                console.log(`There was an error writing ${outputFile} to mp3: ${error.toString()}`)
                return
            }
            //TODO call responder singleton
            context.getTextChannel().send(embedder.createRecordingFileEmbed(outputFile, caption, user.id)).then(msg => {
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

/**
 *
 * @param audioStream
 * @param {string} outputPath
 */
function writeStreamToWavFile(audioStream, outputPath) {
    const wavWriter = new wav.FileWriter(`${outputPath}`, {
        "channels": 2,
        "sampleRate": 48000,
        "bitDepth": 16
    })
    audioStream.pipe(wavWriter)
}

/**
 * Options can be found {@link https://github.com/devowlio/node-lame here}
 * @param {Buffer} audioBuffer
 * @param {string} outputPath
 * @param {string} title
 * @param {string} author
 * @param callback
 */
function writeStreamToMp3File(audioBuffer, outputPath, title, author, callback) {
    const encoder = new lame.Lame({
        "output": outputPath,
        "raw": true,
        "sfreq": 48,
        "bitwidth": 16,
        "signed": true,
        "little-endian": true,
        "mode": 's',
        "meta": {
            "title": "Recording",
            "artist": author,
        }
    }).setBuffer(audioBuffer);

    encoder.encode()
        .then(() => {
            callback(null)
        })
        .catch((error) => {
            callback(error)
        });
}

module.exports.AudioHandler = AudioHandler