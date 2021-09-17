import { bot } from './bot'

bot.onMessage(async (event) => {
  await bot.send(event, event.message!)
})
