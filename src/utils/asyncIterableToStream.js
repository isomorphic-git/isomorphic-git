import { Readable } from 'readable-stream'

export function asyncIterableToStream (ai) {
  return new Readable({
    async read (size) {
      let pause = false
      while (!pause) {
        let {value, done} = await ai.next()
        pause = this.push(value)
        if (done) {
          this.push(null)
          pause = true
        }
      }
    }
  })
}
