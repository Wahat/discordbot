const ytdl = require('ytdl-core-discord')
const search = require('./search.js')
const audioUtils = require('./audio_utils.js')
const textResponder = require('./responder.js').TextResponder
const voiceResponder = require('./responder.js').VoiceResponder
const embedder = require('./embedder.js')

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
        if(!this.guildQueues.has(guildId)) {
            const queueObject = {
                connection: context.getVoiceConnection(),
                songs: [],
                volume: 0.25,
                isPlaying: true,
            };
            this.guildQueues.set(guildId, queueObject)
        }
        return this.guildQueues.get(guildId)
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {int} volume
     * @param relative
     */
    volume(context, volume, relative=false) {
        const queue = this.getGuildQueue(context)
        if (relative) {
            const prevVolume = queue.volume * 100
            volume = prevVolume * (volume / 100)
        }
        const newVolume = volume / 100
        if (queue.connection.dispatcher) {
            queue.connection.dispatcher.setVolume(newVolume);
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
        //TODO show message
        this.playNext(context, queue)
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     */
    stop(context) {
        // if (!message.member.voice.channel)
        //     return message.channel.send(
        //         "You have to be in a voice channel to stop the music!"
        //     );
        const queue = this.getGuildQueue(context)
        queue.songs = [];

        //TODO: show message
        if (queue.connection.dispatcher) {
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
        // TODO: show message
        queue.connection.dispatcher.pause()
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
        // TODO: show message
        queue.connection.dispatcher.resume()
    }

    say(context, message, voice) {
        voiceResponder.respond(this, context, message, voice)
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {int} mode - 0 for start, 1 for end
     */
    playAudioAck(context, mode) {
        const file = mode === 0 ? this.siri_ack_start : this.siri_ack_finish
        const hotwordAckStream = audioUtils.convertMp3FileToOpusStream(file)
        this.playAudioEvent(context, hotwordAckStream, 'opus')
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
    playAudioEvent(context, audioStream, type, callback=()=>{}) {
        const currentSong = this.getGuildQueue(context).songs[0]
        if (currentSong && currentSong.stream) {
            currentSong.stream.unpipe()
            currentSong.stream.pause()
        }
        context.getVoiceConnection().play(audioStream, {
            type: type
        }).on('finish', () => {
            context.getVoiceConnection().removeAllListeners('finish')
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
                textResponder.remove(context, 'play')
                textResponder.remove(context, 'queue')
                this.playNext(context, queue)
            })
            .on('error', error => console.error(error))
        if (song) {
            console.log(`Start playing: **${song.title}**`);
        }
    }

    /**
     *
     * @param {VoiceConnectionMessageContext} context
     * @param {Object} queue
     */
    playNext(context, queue) {
        queue.songs.shift();
        this.playSong(context, queue.songs[0]);
    }
}

module.exports.DJ = new DJ()