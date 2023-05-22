/* eslint-disable prettier/prettier */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function memoriesRoutes(app: FastifyInstance) {
  // Aqui no escopo geral irei passar um hook que executará uma função
  // antes de todas as chamadas. 
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/memories', async (req, res) => {
    // O JWT registrado no Fastify faz com que consigamos verificar
    // se essa requisição está sendo enviada o TOKEN
    // O FRONTEND envia o token via Headers, na camada authorization passando o Bearer Token
    // await req.jwtVerify()



    const memories = await prisma.memory.findMany({
      where: {
        userId: req.user.sub
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    return memories.map((memory) => {
      return {
        id: memory.id,
        coverUrl: memory.coverUrl,
        excerpt: memory.content.substring(0, 115).concat('...'),
      }
    })
  })

  app.get('/memories/:id', async (req, res) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = paramsSchema.parse(req.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      },
    })

    // Caso a memória não seja pertencente à o usuário logado,
    // a memória especifica não dará autorização

    if (!memory.isPublic && memory.userId !== req.user.sub) {
      return res.status(401).send()
    }

    return memory
  })

  app.post('/memories', async (req, res) => {

    const bodySchema = z.object({
      content: z.string(),
      isPublic: z.coerce.boolean().default(false),
      coverUrl: z.string()
    })
    const { content, isPublic, coverUrl } = bodySchema.parse(req.body)

    const memory = await prisma.memory.create({
      data: {
        content,
        isPublic,
        coverUrl,
        userId: req.user.sub
      }
    })

    return memory

  })


  app.put('/memories/:id', async (req, res) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = paramsSchema.parse(req.params)
    const bodySchema = z.object({
      content: z.string(),
      isPublic: z.coerce.boolean().default(false),
      coverUrl: z.string()
    })
    const { content, isPublic, coverUrl } = bodySchema.parse(req.body)

    let memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id
      }
    })

    if (memory.userId !== req.user.sub) {
      return res.status(401).send()
    }

    memory = await prisma.memory.update({
      where: {
        id,
      },
      data: {
        content,
        isPublic,
        coverUrl,

      }
    })
    return memory

  })

  app.delete('/memories/:id', async (req, res) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = paramsSchema.parse(req.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id
      }
    })

    if (memory.userId !== req.user.sub) {
      return res.status(401).send()
    }

    await prisma.memory.delete({
      where: {
        id,
      },
    })

  })
}
