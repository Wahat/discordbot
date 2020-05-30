const stream = require('stream')

class Recorder extends stream.Transform {
    constructor() {
        super();
        this.rollingBuffer = []
        this.writing = false
    }

    getRecordedStream() {
        this.writing = true
        // const buffer = Buffer.alloc(this.rollingBuffer.length)
        // for (let i = 0; i < this.rollingBuffer.length; i++) {
        //     buffer.writeUInt8(this.rollingBuffer.pop(), i)
        // }
        let duplex = new stream.Duplex();
        duplex.push(this.getBuffer());
        duplex.push(null);
        this.writing = false
        return duplex;
    }

    getBuffer() {
        return Buffer.concat(this.rollingBuffer)
    }

    _transform(chunk, encoding, callback) {
        if (!this.writing) {
            for (let i = 0; i < chunk.length; i++) {
                // if (this.rollingBuffer.length === 640000) {
                //     this.rollingBuffer.pop()
                // }
                // this.rollingBuffer.push(chunk[i])
            }
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