// inspired by 'gartal' but lighter-weight and more battle-tested.
export class StreamReader {
  constructor (stream) {
    this.stream = stream
    this.buffer = null
    this.cursor = 0
    this.undoCursor = 0
    this.started = false
    this._ended = false
    this._discardedBytes = 0
  }
  eof () {
    return this._ended && this.cursor === this.buffer.length
  }
  tell () {
    return this._discardedBytes + this.cursor
  }
  async byte () {
    if (this.eof()) return
    if (!this.started) await this._init()
    if (this.cursor === this.buffer.length) {
      await this._loadnext()
      if (this._ended) return
    }
    this._moveCursor(1)
    return this.buffer[this.undoCursor]
  }
  async chunk () {
    if (this.eof()) return
    if (!this.started) await this._init()
    if (this.cursor === this.buffer.length) {
      await this._loadnext()
      if (this._ended) return
    }
    this._moveCursor(this.buffer.length)
    return this.buffer.slice(this.undoCursor, this.cursor)
  }
  async read (n) {
    if (this.eof()) return
    if (!this.started) await this._init()
    if (this.cursor + n > this.buffer.length) {
      this._trim()
      await this._accumulate(n)
    }
    this._moveCursor(n)
    return this.buffer.slice(this.undoCursor, this.cursor)
  }
  async skip (n) {
    if (this.eof()) return
    if (!this.started) await this._init()
    if (this.cursor + n > this.buffer.length) {
      this._trim()
      await this._accumulate(n)
    }
    this._moveCursor(n)
  }
  async undo () {
    this.cursor = this.undoCursor
  }
  _next () {
    return new Promise((resolve, reject) => {
      this.started = true
      this.stream.once('error', err => {
        this.stream.removeAllListeners()
        reject(err)
      })
      this.stream.once('end', () => {
        this.stream.removeAllListeners()
        this._ended = true
        resolve()
      })
      this.stream.once('readable', () => {
        this.stream.removeAllListeners()
        let buffers = []
        let data = this.stream.read()
        while (data) {
          buffers.push(data)
          data = this.stream.read()
        }
        let nextbuffer = Buffer.concat(buffers)
        if (nextbuffer.length === 0) {
          this._ended = true
          this.stream.destroy()
        }
        resolve(nextbuffer)
      })
    })
  }
  _trim () {
    // Throw away parts of the buffer we don't need anymore
    // assert(this.cursor <= this.buffer.length)
    this.buffer = this.buffer.slice(this.undoCursor)
    this.cursor -= this.undoCursor
    this._discardedBytes += this.undoCursor
    this.undoCursor = 0
  }
  _moveCursor (n) {
    this.undoCursor = this.cursor
    this.cursor += n
    if (this.cursor > this.buffer.length) {
      this.cursor = this.buffer.length
    }
  }
  async _accumulate (n) {
    if (this._ended) return
    // Expand the buffer until we have N bytes of data
    // or we've reached the end of the stream
    let buffers = [this.buffer]
    while (this.cursor + n > lengthBuffers(buffers)) {
      let nextbuffer = await this._next()
      if (this._ended) break
      buffers.push(nextbuffer)
    }
    this.buffer = Buffer.concat(buffers)
  }
  async _loadnext () {
    this._discardedBytes += this.buffer.length
    this.undoCursor = 0
    this.cursor = 0
    this.buffer = await this._next()
  }
  async _init () {
    this.buffer = await this._next()
  }
}

// This helper function helps us postpone concatenating buffers, which
// would create intermediate buffer objects,
function lengthBuffers (buffers) {
  return buffers.reduce((acc, buffer) => acc + buffer.length, 0)
}
