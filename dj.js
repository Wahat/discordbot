const ytdl = require('ytdl-core-discord')
const search = require('./search.js')
const audioUtils = require('./audio_utils.js')
const textResponder = require('./responder.js').TextResponder
const voiceResponder = require('./responder.js').VoiceResponder
const embedder = require('./embedder.js').Embedder

class DJHandler {
    siri_ack_start = './resources/siri_acknowledge.mp3'
    siri_ack_finish = './resources/siri_acknowledge_done.mp3'

    constructor() {
        /** @member {Map<string><Object>} **/
        this.guildDJs = new Map()
    }

    /**
     *
     * @param {MessageContext} context
     * @returns {Object}
     */
    getGuildDJ(context) {
        const guildId = context.getVoiceConnection().channel.guild.id
        if (!this.guildDJs.has(guildId)) {
            const dj = {
                connection: context.getVoiceConnection(),
                queue: [],
                volume: context.getConfig()["volume"],
                isPlaying: false,
            };
            this.guildDJs.set(guildId, dj)
        }
        if (context.getVoiceConnection() &&
            context.getVoiceConnection() !== this.guildDJs.get(guildId).connection) {
            this.guildDJs.get(guildId).connection = context.getVoiceConnection()
        }
        return this.guildDJs.get(guildId)
    }

    /**
     *
     * @param {MessageContext} context
     * @param {int} volume
     * @param relative
     */
    volume(context, volume, relative = false) {
        const dj = this.getGuildDJ(context)
        if (relative) {
            const prevVolume = dj.volume * 100
            volume = prevVolume * (volume / 100)
        }
        const newVolume = volume / 100
        if (dj.connection.dispatcher) {
            dj.connection.dispatcher.setVolume(newVolume);
        }
        dj.volume = newVolume
        textResponder.react(context, '👌')
    }

    /**
     *
     * @param {MessageContext} context
     */
    queue(context) {
        const dj = this.getGuildDJ(context)
        textResponder.respond(context, embedder.createQueueEmbed(dj.queue, null), 'queue')
    }

    /**
     *
     * @param {MessageContext} context
     * @param index
     */
    song(context, index) {
        const dj = this.getGuildDJ(context)
        textResponder.respond(context, embedder.createSongDetailsEmbed(dj.queue, index), 'current')
    }

    /**
     *
     * @param {MessageContext} context
     */
    skip(context) {
        const dj = this.getGuildDJ(context)
            this.playNext(context)
        if (!textResponder.react(context, '👌')) {
            textResponder.respond(context, embedder.createBasicMessageEmbed('Skipping!'))
        }
    }

    /**
     *
     * @param {MessageContext} context
     */
    stop(context) {
        const dj = this.getGuildDJ(context)
        if (dj.connection.dispatcher) {
            if (!textResponder.react(context, '👌')) {
                textResponder.respond(context, embedder.createBasicMessageEmbed('Stopping!'))
            }
            dj.connection.dispatcher.end();
        }
        this.guildDJs.delete(context.getGuild().id)
    }

    /**
     *
     * @param {MessageContext} context
     */
    pause(context) {
        const dj = this.getGuildDJ(context)
        if (!dj.connection.dispatcher) {
            return
        }
        dj.connection.dispatcher.pause()
        if (!textResponder.react(context, '👌')) {
            textResponder.respond(context, embedder.createBasicMessageEmbed('Pausing!'))
        }
    }

    /**
     *
     * @param {MessageContext} context
     */
    resume(context) {
        const dj = this.getGuildDJ(context)
        if (!dj.connection.dispatcher) {
            return
        }
        dj.connection.dispatcher.resume()
        if (!textResponder.react(context, '👌')) {
            textResponder.respond(context, embedder.createBasicMessageEmbed('Pausing!'))
        }
    }

    say(context, message, voice) {
        voiceResponder.respond(this, context, message, voice)
    }

    /**
     *
     * @param {MessageContext} context
     * @param {int} mode - 0 for start, 1 for end
     * @param callback
     */
    playHotwordAudioAck(context, mode, callback) {
        const file = mode === 0 ? this.siri_ack_start : this.siri_ack_finish
        const hotwordAckStream = audioUtils.convertMp3FileToOpusStream(file)
        this.playAudioEvent(context, hotwordAckStream, 'opus', callback)
    }

    /**
     *
     * @param {MessageContext} context
     * @param stream
     */
    playAudioWavStream(context, stream) {
        this.playAudioEvent(context, stream, 'converted')
    }

    /**
     * Interrupts current song to play an audio clip, then resumes song
     * @param {MessageContext} context
     * @param {ReadableStream | Readable} audioStream
     * @param {string} type
     * @param callback
     */
    playAudioEvent(context, audioStream, type, callback = () => {}) {
        const currentSong = this.getGuildDJ(context).queue[0]
        if (currentSong && currentSong.stream) {
            currentSong.stream.unpipe()
            currentSong.stream.pause()
        }
        this.getGuildDJ(context).connection.play(audioStream, {
            type: type,
            volume: this.getGuildDJ(context).volume
        }).once('finish', () => {
            audioStream.destroy()
            audioStream = undefined
            this.playSong(context, currentSong, true)
            callback()
        })
    }

    /**
     *
     * @param {MessageContext} context
     * @param {string} args
     * @returns {Promise<void>}
     */
    async play(context, args) {
        const url = await search.searchYoutube(args)
        textResponder.startTyping(context)
        const songInfo = await ytdl.getInfo(url);
        textResponder.stopTyping(context)
        const song = {
            title: songInfo.title,
            url: songInfo.video_url,
            thumbnail: songInfo.thumbnail_url,
            author: songInfo.author,
            length: songInfo.length_seconds,
            requesterId: context.getUser().id,
            stream: null
        }
        const dj = this.getGuildDJ(context)
        dj.queue.push(song)
        if (dj.queue.length === 1) {
            this.playSong(context, dj.queue[0])
        } else {
            textResponder.remove(context, 'queue')
            textResponder.respond(context, embedder.createQueueEmbed(dj.queue, song), 'queue')
            console.log(`${song.title} was added to the queue, new queue size ${dj.queue.length}`)
        }
    }

    /**
     *
     * @param {MessageContext} context
     * @param {Object} song
     * @param {boolean} resume
     * @returns {Promise<void>}
     */
    async playSong(context, song, resume = false) {
        const dj = this.getGuildDJ(context)
        if (!song || (resume && !song.stream)) {
            if (dj.connection.dispatcher) {
                dj.connection.dispatcher.end()
            }
            return
        }
        if (!resume) {
            textResponder.respond(context, embedder.createNowPlayingEmbed(song), 'play')
            await voiceResponder.respond(this, context, `Playing ${song.title}`)
            song.stream = await ytdl(song.url, {
                quality: 'highestaudio',
                highWaterMark: 1024 * 1024 * 10,
            })
        } else {
            song.stream.resume()
        }

        const dispatcher = dj.connection.play(song.stream, {
            type: 'opus',
            volume: dj.volume,
            highWaterMark: 48
        })
        dispatcher.once('finish', () => {
            textResponder.remove(context, 'play')
            textResponder.remove(context, 'queue')
            this.playNext(context)
        })
        dispatcher.once('error', error => console.error(error))

        if (song && !resume) {
            console.log(`Start playing: **${song.title}**`)
        }
    }

    /**
     *
     * @param {MessageContext} context
     */
    playNext(context) {
        const dj = this.getGuildDJ(context)
        const song = dj.queue.shift()
        if (song) {
            song.stream = null
        }
        this.playSong(context, dj.queue[0])
    }
}

module.exports.DJHandler = new DJHandler()