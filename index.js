const { ApolloLink } = require('apollo-link')
// const { Observable } = require('rxjs')
const chalk = require('chalk')
require('rxjs/Rx')
require('isomorphic-fetch')
const gql = require('graphql-tag')
const { ApolloClient } = require('apollo-client')
const { createHttpLink } = require('apollo-link-http')
const { onError } = require('apollo-link-error')
const { InMemoryCache } = require('apollo-cache-inmemory')
const { RetryLink } = require('apollo-link-retry')

const requestLink = createHttpLink({ uri: 'http://localhost:3000/graphql' })
const errorLink = onError(({ response, operation }) => {
  console.log('*****')
})

const retyLink = new RetryLink({
  max: 100,
  delay: 1000,
  interval: (delay, count) => {
    return 1000
  }
})

const Client = new ApolloClient({
  link: ApolloLink.from([retyLink, errorLink, requestLink]),
  cache: new InMemoryCache()
})

const getTodosQuery = gql`
query get($id: Int) {
  todos(id:$id) {
    id
    name
  }
}`
let todos = Client.watchQuery({
  query: getTodosQuery,
  fetchPolicy: 'network-only',
  pollInterval: 10000,
  errorPolicy: 'all'
})
todos.subscribe({
  next: (
    data) => {
    console.log(JSON.stringify(data, null, 2))
  },
  error: (e) => {
    // console.log(e)
  },
  complete: () => {
    console.log('compleated')
  }
})

const AddTodoMutation = gql(`
mutation add ($name:String!){
  addTodo(name:$name) {
    id
    name
  }
}
`)

function addTodo(name) {
  const added = Client.mutate({
    mutation: AddTodoMutation,
    variables: { name: name },
    optimisticResponse: {
      addTodo: {
        id: -1,
        name: name,
        __typename: 'Todo'
      }
    },
    update: function (store, { data }) {
      try {
        let todos = store.readQuery({ query: getTodosQuery })
        todos.todos.push(data.addTodo)
        store.writeQuery({ query: getTodosQuery, data: todos })
      } catch (e) {
        console.log(e)
      }
    }
  })
    .then(data => {
      console.log(chalk.green('got data', JSON.stringify(data, null, 2)))
    })
}

setTimeout(() => {
  addTodo('finish6')
}, 50)

// setTimeout(() => {
//   addTodo('finish7')
// }, 100)
// addTodo('finish2')
// addTodo('finish3')
