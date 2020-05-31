const stream = require('stream')

class Recorder extends stream.Transform {
    constructor() {
        super();
        this.rollingBuffer = []
        this.writing = false
    }

    /**
     *
     * @returns {Duplex | module:stream.internal.Duplex}
     */
    getRecordedStream() {
        this.writing = true
        let duplex = new stream.Duplex();
        duplex.push(this.getBuffer());
        duplex.push(null);
        this.writing = false
        return duplex;
    }

    /**
     *
     * @returns {Buffer}
     */
    getBuffer() {
        return Buffer.concat(this.rollingBuffer)
    }

    _transform(chunk, encoding, callback) {
        if (!this.writing) {
            if (this.rollingBuffer.length > 1000) {
                this.rollingBuffer.shift()
            }
            this.rollingBuffer.push(chunk)
        }
        this.push(chunk)
        callback()
    }
}

module.exports.Recorder = Recorder