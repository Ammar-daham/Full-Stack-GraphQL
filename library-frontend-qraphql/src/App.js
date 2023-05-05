import { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import { useQuery, useSubscription, useApolloClient } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS, ME, BOOK_ADDED } from './queries'
import LoginForm from './components/LoginForm'
import RecommendBooks from './components/RecommendBooks'
import { updateCache } from './cache'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  const [ error, setError ] = useState(null)
  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)
  const me = useQuery(ME)

  const client = useApolloClient()

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      console.log(data)
      const addedBook = data.data.bookAdded
      window.alert(`${addedBook.title} has been added to library` );
      updateCache(client.cache, { query: ALL_BOOKS }, addedBook)
    }
  })

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  if (authors.loading || books.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token ? (
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage('recommend')}>recommend</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage('login')}>Login</button>
        )}
      </div>

      <Authors show={page === 'authors'} authors={authors.data?.allAuthors} />
      <Books show={page === 'books'} books={books.data?.allBooks} />
      {token && (
        <RecommendBooks
          show={page === 'recommend'}
          user={me.data}
          books={books.data?.allBooks}
        />
      )}
      <NewBook show={page === 'add'} setError={setError} error={error} />
      {!token && (
        <LoginForm
          show={page === 'login'}
          setToken={setToken}
        />
      )}
    </div>
  )
}

export default App
