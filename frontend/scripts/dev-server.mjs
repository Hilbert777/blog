import { createServer } from 'vite'

const server = await createServer({
  root: process.cwd(),
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})

await server.listen()
server.printUrls()

setInterval(() => {}, 1000)
