const he = require('he')

const reddit = require('../data/reddit')
const dcache = require('../discord/cache')
const Markov = require('./markov')

const maxGenerations = 1500

class ComboBrain {
  #brain
  #counter = 0

  constructor () {
    this.#brain = new Markov(2)
    this.thinking = false
  }

  reset () {
    this.#counter = maxGenerations
  }

  learn (msg) {
    this.thinking = true
    this.#brain.feed(msg)
    this.thinking = false
    dcache.addMessage(msg)
  }

  async replyShort (msg) {
    this.thinking = true

    await this.#reseed()

    let text = this.#generateShort(msg)
    text = he.decode(text)
    if (text.length > 700) {
      text = text.substring(0, 700)
    }

    this.thinking = false

    return text
  }

  async replyLong (msg) {
    this.thinking = true

    await this.#reseed()

    let text = this.#generateLong(msg)
    text = he.decode(text)
    if (text.length > 10000) {
      text = text.substring(0, 10000)
    }

    this.thinking = false

    return text
  }

  #generateShort (text) {
    this.#counter++

    const length = Math.round(1 + Math.random() * 9)
    if (Math.random() < 0.6) {
      console.log('Generating full response, length ' + length)
      return this.#brain.speakResponse(text, length)
    } else {
      console.log('Generating random response, length ' + length)
      return this.#brain.speakRand(length)
    }
  }

  #generateLong (text) {
    this.#counter++

    const length = Math.round(10 + Math.random() * 80)
    if (Math.random() < 0.6) {
      console.log('Generating full response, length ' + length)
      return this.#brain.speakResponse(text, length)
    } else {
      console.log('Generating random response, length ' + length)
      return this.#brain.speakRand(length)
    }
  }

  async #reseed () {
    if (this.#counter % maxGenerations !== 0) {
      return
    }

    console.log('Reseeding...')

    this.#brain = new Markov(2)

    const messages = dcache.getMessages()
    await this.#brain.feedArray(messages, _ => Math.random() > 0.3)

    const comments = await reddit.getComments(10)
    const titles = await reddit.getTitles(10)

    await this.#brain.feedArray(comments)
    await this.#brain.feedArray(titles)

    console.log('Done reseeding!')
  }
}

module.exports = new ComboBrain()
