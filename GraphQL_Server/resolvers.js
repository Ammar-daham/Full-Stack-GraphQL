const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const resolvers = {
  Book: {
    author: async (book) => {
      const author = await Author.findById(book.author)
      return {
        id: author._id.toString(),
        name: author.name,
        born: author.born,
        bookCount: await Book.find({ author: author._id }).countDocuments(),
      }
    },
  },
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (!args.author && !args.genre) {
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
      // const authors = await Author.find({})
      // const books = await Book.find({})
      // return authors.map((author) => ({
      //   name: author.name,
      //   born: author.born,
      //   bookCount: books.filter(
      //     (book) => book.author.toString() === author._id.toString(),
      //   ).length,
      // }))
      const authors = await Author.find({})

      // Fetch all the books associated with each author
      const books = await Book.find({
        author: { $in: authors.map((a) => a._id) },
      }).populate('author')

      // Count the number of books associated with each author
      const bookCounts = books.reduce((acc, book) => {
        const authorId = book.author._id.toString()
        if (!acc[authorId]) {
          acc[authorId] = 0
        }
        acc[authorId]++
        return acc
      }, {})

      // Combine author data with book count
      return authors.map((author) => ({
        name: author.name,
        born: author.born,
        bookCount: bookCounts[author._id.toString()] || 0,
      }))
    },
    me: (root, args, context) => {
      return context.currentUser
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      let author = await Author.findOne({ name: args.author })
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }
      if (!author) {
        try {
          author = new Author({ name: args.author })
          await author.save()
        } catch (error) {
          throw new GraphQLError('Saving author failed', {
            extensions: {
              code: 'author name must be unique and 4 char',
              invalidArgs: args.name,
              error,
            },
          })
        }
      }
      const newBook = new Book({ ...args, author })
      try {
        await newBook.save()
      } catch (error) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
            code: 'Book title must be unique and 5 char',
            invalidArgs: args.name,
            error,
          },
        })
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: newBook })

      return newBook
    },
    editAuthor: async (root, args, context) => {
      const author = await Author.findOne({ name: args.name })
      const currentUser = context.currentUser
      console.log(currentUser)
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }
      author.born = args.born
      try {
        await author.save()
      } catch (error) {
        throw new GraphQLError('Saving born year failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      }
      return author
    },
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      })
      return user.save().catch((error) => {
        throw new GraphQLError('Creating the user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
}

module.exports = resolvers
