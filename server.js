const koa = require('koa') // koa@2
const koaRouter = require('koa-router') // koa-router@next
const koaBody = require('koa-bodyparser') // koa-bodyparser@next
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa')
const { makeExecutableSchema } = require('graphql-tools')
const Promise = require('bluebird');
const app = new koa()
const router = new koaRouter()
const PORT = 3000

const typeDefs = `
  schema {
    query: Query
    mutation: Mutation
  }
  type Query {
    todos(id: Int): [Todo]
  }
  type Mutation {
    addTodo(name: String!) : Todo
  }
  type Todo {
    id: Int,
    name : String
  }
`
let todos = []
let ids = 0
const resolvers = {
  Query: {
    todos: function () {
      return todos
    }
  },

  Mutation: {
    addTodo: function (parent, { name }, context, info) {
      return Promise.delay(2000)
        .then(() => {
          let todo = {
            id: ++ids,
            name: name
          }
          todos.push(todo)
          return Promise.resolve(todo)
        })
    }
  }
}

const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers
})

// koaBody is needed just for POST.
router.post('/graphql', koaBody(), graphqlKoa({
  schema: myGraphQLSchema
}))
router.get('/graphql', graphqlKoa({
  schema: myGraphQLSchema
}))

router.get('/graphiql', graphiqlKoa({
  endpointURL: '/graphql'
}))

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(PORT, () => console.log('all good chief'))
