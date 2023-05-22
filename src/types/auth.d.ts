import '@fastify/jwt'
// Criando a tipagem do JWT token

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string
      name: string
      avatarUrl: string
    } // user type is return type of `request.user` object
  }
}
