const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const gql = require('graphql-tag')
const { GraphQLError } = require('graphql')
const { v1: uuid } = require('uuid')
const Author = require('./models/author')
const Book = require('./models/book')

const mongoose = require('mongoose')
const book = require('./models/book')
const author = require('./models/author')

mongoose.set('strictQuery', false)

require('dotenv').config()

const MONGO_URI = process.env.MONGODB_URL

console.log('connection to ', MONGO_URI)

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB: ', error.message)
  })

let authors = [
  {
    name: 'Robert Martin',
    id: 'afa51ab0-344d-11e9-a414-719c6709cf3e',
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: 'afa5b6f0-344d-11e9-a414-719c6709cf3e',
    born: 1963,
  },
  {
    name: 'Fyodor Dostoevsky',
    id: 'afa5b6f1-344d-11e9-a414-719c6709cf3e',
    born: 1821,
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: 'afa5b6f2-344d-11e9-a414-719c6709cf3e',
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: 'afa5b6f3-344d-11e9-a414-719c6709cf3e',
  },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conección con el libro
 */

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: 'afa5b6f4-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring'],
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: 'afa5b6f5-344d-11e9-a414-719c6709cf3e',
    genres: ['agile', 'patterns', 'design'],
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: 'afa5de00-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring'],
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: 'afa5de01-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring', 'patterns'],
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: 'afa5de02-344d-11e9-a414-719c6709cf3e',
    genres: ['refactoring', 'design'],
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: 'afa5de03-344d-11e9-a414-719c6709cf3e',
    genres: ['classic', 'crime'],
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: 'afa5de04-344d-11e9-a414-719c6709cf3e',
    genres: ['classic', 'revolution'],
  },
]


const typeDefs = gql`

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book!
    editAuthor(
      name: String!
      born: Int!
    ): Author
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }
`

const resolvers = {
  Book: {
    author: async (book) => {
      const author = await Author.findById(book.author);
      return {
        id: author._id.toString(),
        name: author.name,
        born: author.born,
        bookCount: await Book.find({ author: author._id }).countDocuments(),
      };
    },
  },
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if(!args.author && !args.genre) {
        const books = await Book.find().populate('author')
          return books.map((book) => ({
          title: book.title,
          published: book.published,
          genres: book.genres,
          author: book.author,
        }))
      }
      if (args.author && args.genre) {
        const author = await Author.findOne({ name: args.author })
        return Book.find({
          author: author._id,
          genres: { $in: [args.genre] },
        }).populate('author')
      }
      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        return Book.find({ author: author._id }).populate('author')
      }
      return Book.find({ genres: { $in: [args.genre] } }).populate('author')
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      const books = await Book.find({})
      return authors.map((author) => ({
        name: author.name,
        born: author.born,
        bookCount: books.filter((book) => book.author.toString() === author._id.toString()).length
      }))
    } 
  },
  Mutation: {
    addBook: async (root, args) => {
      let author = await Author.findOne({ name: args.author })
      if (!author) {
        try{
          author = new Author({ name: args.author })
          await author.save()
        } catch(error) {
          throw new GraphQLError('Saving author failed', {
            extensions: {
              code: 'author name must be unique and 4 char',
              invalidArgs: args.name,
              error
            }
        })
        }
      } 
      const newBook = new Book({ ...args, author })
      try {
        await newBook.save()
      } catch(error) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
            code: 'Book title must be unique and 5 char',
            invalidArgs: args.name,
            error
          }
      })
    }
    return newBook
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      author.born = args.born
      try {
        await author.save()
      } catch(error) {
        throw new GraphQLError('Saving born year failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
      return author
    }
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
