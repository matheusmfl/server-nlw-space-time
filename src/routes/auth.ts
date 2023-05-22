import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

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
      id: z.number(),
      login: z.string(),
      avatar_url: z.string().url(),
      name: z.string(),
    })

    const userInfo = userSchema.parse(userReponse.data)

    // nesse passo veremos se já existe um user criado, usaremos o ID do github para
    // verificar se o usuário já existe no banco de dados.

    let user = await prisma.user.findUnique({
      where: { githubId: userInfo.id },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          login: userInfo.login,
          avatarUrl: userInfo.avatar_url,
          name: userInfo.name,
        },
      })
    }

    // Aqui geramos o token.
    // Primeiro objeto de configuração é quais informações do usuário queremos colocar no token ( infos públicas )
    // o segundo objeto de configuração é onde passamos o Sub, basicamente qual usuário percente esse Token, tipo o ID
    // ainda no segundo colocamos o tempo de expiração do token
    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      },
    )
    console.log(token)

    // o retorno dessa rota deve ser o token gerado pelo JWT
    return {
      token,
    }
  })
}
