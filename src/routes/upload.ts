import { randomUUID } from 'node:crypto'
import { extname, resolve } from 'node:path'
import { FastifyInstance } from 'fastify'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

// pipeline permite aguardar uma stream, o processo de upload finalizar.
// no Node não usa Promise por padrão, o promisify transforma o pipeline numa Promise
const pump = promisify(pipeline)

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (req, res) => {
    const upload = await req.file({
      limits: {
        fileSize: 1024 * 1024 * 5, // 5mb
      },
    })

    if (!upload) {
      return res.status(400).send({
        message: 'No file uploaded',
      })
    }

    // setando tipo de arquivo que receberemos no upload
    const regexMimeType = /^(image|video)\/[a-zA-Z]+/

    const isValidFormat = regexMimeType.test(upload.mimetype)

    if (!isValidFormat) {
      return res.status(400).send({
        message: 'Invalid file type',
      })
    }

    const fileId = randomUUID()
    // pegando o tipo do arquivo ou a extensão
    const extension = extname(upload.filename)

    const filename = fileId + extension

    const writeSteam = createWriteStream(
      resolve(__dirname, '../../uploads', filename), // resolve resolve o caminho independente do sistema operacional
    )

    // persistindo o arquivo no sistema
    // pump vem do PIPELINE do node, leia a documentação do fastify-multipart
    await pump(upload.file, writeSteam)

    // agora eu preciso de uma URL para esse arquivo de imagem.

    const fullURL = req.protocol.concat('://').concat(req.hostname)
    const fileURL = new URL(`/uploads/${filename}`, fullURL).toString()

    return { fileURL }
  })
}
