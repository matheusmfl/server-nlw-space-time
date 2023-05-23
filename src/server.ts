import 'dotenv/config'

import fastify from 'fastify'
import multipart from '@fastify/multipart'
import cors from '@fastify/cors'
import { memoriesRoutes } from './routes/memories'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { uploadRoutes } from './routes/upload'
import { resolve } from 'node:path'

const app = fastify()
app.register(cors, {
  origin: true,
})

app.register(memoriesRoutes)
// Esse registro serve para tornar uma pasta da nossa aplicação pública
app.register(require('@fastify/static'), {
  root: resolve(__dirname, '../uploads'),
  prefix: '/uploads',
})

app.register(uploadRoutes)
app.register(multipart)
app.register(authRoutes)
app.register(jwt, {
  secret: 'spacetime',
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('🚀 HTTP Server running on port 3333')
  })
