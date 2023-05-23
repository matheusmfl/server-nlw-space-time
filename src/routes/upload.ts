import { FastifyInstance } from 'fastify'

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
  })
}
