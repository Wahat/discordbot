const ytdl = require('ytdl-core-discord')
const search = require('./search.js')
const audioUtils = require('./audio_utils.js')
const textResponder = require('./responder.js').TextResponder
const voiceResponder = require('./responder.js').VoiceResponder
const embedder = require('./embedder.js').Embedder

class DJ {
    siri_ack_start = './resources/siri_acknowledge.mp3'
    siri_ack_finish = './resources/siri_acknowledge_done.mp3'

    constructor() {
        /** @member {Map<string><Object>} **/
        this.guildQueues = new Map()
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @returns {Object}
     */
    getGuildQueue(context) {
        const guildId = context.getVoiceConnection().channel.guild.id
        if (!this.guildQueues.has(guildId)) {
            context.getVoiceConnection()
            const queueObject = {
                connection: context.getVoiceConnection(),
                songs: [],
                volume: 0.25,
                isPlaying: true,
            };
            this.guildQueues.set(guildId, queueObject)
        }
        if (context.getVoiceConnection() &&
            context.getVoiceConnection() !== this.guildQueues.get(guildId).connection) {
            this.guildQueues.get(guildId).connection = context.getVoiceConnection()
        }
        return this.guildQueues.get(guildId)
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {int} volume
     * @param relative
     */
    volume(context, volume, relative = false) {
        const queue = this.getGuildQueue(context)
        if (relative) {
            const prevVolume = queue.volume * 100
            volume = prevVolume * (volume / 100)
        }
        const newVolume = volume / 100
        if (queue.connection.dispatcher) {
            queue.connection.dispatcher.setVolume(newVolume);
            textResponder.react(context, '👌')
        }
        queue.volume = newVolume
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     */
    queue(context) {
        const queue = this.getGuildQueue(context)
        textResponder.respond(context, embedder.createQueueEmbed(queue.songs, null), 'queue')
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param index
     */
    song(context, index) {
        const queue = this.guildQueues.get(context.getGuildId())
        textResponder.respond(context, embedder.createSongDetailsEmbed(queue.songs, index), 'current')
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     */
    skip(context) {
        const queue = this.getGuildQueue(context)
        this.playNext(context, queue)
        textResponder.react(context, '👌')
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     */
    stop(context) {
        const queue = this.getGuildQueue(context)
        queue.songs = [];

        if (queue.connection.dispatcher) {
            textResponder.react(context, '👌')
            queue.connection.dispatcher.end();
        }
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     */
    pause(context) {
        const queue = this.getGuildQueue(context)
        if (queue.connection.dispatcher == null) {
            return
        }
        if (queue.connection.dispatcher) {
            textResponder.react(context, '👌')
            queue.connection.dispatcher.pause()
        }
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     */
    resume(context) {
        const queue = this.getGuildQueue(context)
        if (queue.connection.dispatcher == null) {
            return
        }
        if (queue.connection.dispatcher) {
            textResponder.react(context, '👌')
            queue.connection.dispatcher.resume()
        }
    }

    say(context, message, voice) {
        voiceResponder.respond(this, context, message, voice)
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {int} mode - 0 for start, 1 for end
     * @param callback
     */
    playAudioAck(context, mode, callback) {
        const file = mode === 0 ? this.siri_ack_start : this.siri_ack_finish
        const hotwordAckStream = audioUtils.convertMp3FileToOpusStream(file)
        this.playAudioEvent(context, hotwordAckStream, 'opus', callback)
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param stream
     */
    playAudioWavStream(context, stream) {
        this.playAudioEvent(context, stream, 'converted')
    }

    /**
     * Interrupts current song to play an audio clip, then resumes song
     * @param {VoiceConnectionMessageContext} context
     * @param {ReadableStream} audioStream
     * @param {string} type
     * @param callback
     */
    playAudioEvent(context, audioStream, type, callback = () => {}) {
        const currentSong = this.getGuildQueue(context).songs[0]
        if (currentSong && currentSong.stream) {
            currentSong.stream.unpipe()
            currentSong.stream.pause()
        }
        this.getGuildQueue(context).connection.play(audioStream, {
            type: type
        }).on('finish', () => {
            this.playSong(context, currentSong, true)
            callback()
        })
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {string} args
     * @returns {Promise<void>}
     */
    async play(context, args) {
        // TODO refactor to not work only for youtube
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
        const queue = this.getGuildQueue(context)
        queue.songs.push(song)
        if (queue.songs.length === 1) {
            this.playSong(context, queue.songs[0])
        } else {
            textResponder.remove(context, 'queue')
            textResponder.respond(context, embedder.createQueueEmbed(queue.songs, song), 'queue')
            console.log(`${song.title} was added to the queue, new queue size ${queue.songs.length}`)
        }
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {Object} song
     * @param {boolean} resume
     * @returns {Promise<void>}
     */
    async playSong(context, song, resume = false) {
        const queue = this.getGuildQueue(context)
        if (!song || (resume && !song.stream)) {
            if (queue.connection.dispatcher) {
                queue.connection.dispatcher.end()
            }
            return
        }
        if (!resume) {
            song.stream = await ytdl(song.url, {
                quality: 'highestaudio',
                highWaterMark: 1024 * 1024 * 10,
            })
        } else {
            song.stream.resume()
        }

        if (queue.connection.dispatcher) { // Clear listeners
            queue.connection.dispatcher.removeAllListeners('start')
            queue.connection.dispatcher.removeAllListeners('error')
            queue.connection.dispatcher.removeAllListeners('finish')
            queue.connection.dispatcher.end()
        }
        queue.connection
            .play(song.stream, {
                type: 'opus',
                volume: queue.volume,
                highWaterMark: 48
            })
            .on('start', () => {
                if (!resume) {
                    textResponder.respond(context, embedder.createNowPlayingEmbed(song), 'play')
                    voiceResponder.respond(this, context, `Playing ${song.title}`)
                }
            })
            .on('finish', () => {
                this.playNext(context, queue)
            })
            .on('error', error => console.error(error))
        if (song && !resume) {
            console.log(`Start playing: **${song.title}**`)
        }
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {Object} queue
     */
    playNext(context, queue) {
        textResponder.remove(context, 'play')
        textResponder.remove(context, 'queue')
        queue.songs.shift();
        this.playSong(context, queue.songs[0]);
    }
}

module.exports.DJ = new DJ()