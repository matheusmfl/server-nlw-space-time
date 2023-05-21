import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { z } from 'zod'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const bodySchema = z.object({
      code: z.string(),
    })
    const { code } = bodySchema.parse(request.body)

    // Chamada para solicitar o AcessToken do Github, o primeiro parâmetro é a rota,
    // o segundo parâmetro é o o body da requisição, que no caso não tem, por isso Null
    // o terceiro é os parametros da requisição, é os PARAMS que vai pela URL, no Axios posso passar os Params como um objeto PARAMS

    const accessTokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          Accept: 'application/json',
        },
      },
    )

    // retornando o Acess_Token dessa requisição acima.

    const { access_token } = accessTokenResponse.data

    // de posse do AccessToken, farei uma nova requisição, pegando os dados do usuário autenticado.

    const userReponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    // como o userResponse é uma Promise, preciso capturar os dados do usuário

    const userSchema = z.object({
      id: z.string(),
      login: z.string(),
      avatar_url: z.string().url(),
      name: z.string(),
    })

    const user = userSchema.parse(userReponse.data)

    return {
      user,
    }
  })
}
