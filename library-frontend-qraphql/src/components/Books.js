import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { BOOKS_BY_GENRE } from '../queries'

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState('')

  const { loading, data } = useQuery(BOOKS_BY_GENRE, {
    variables: { genre: selectedGenre },
  })

  if (!props.show) {
    return null
  }

  if (loading) {
    return <div>Loading...</div>
  }

  // const booksToShow = selectedGenre
  //   ? props.books.filter((book) => book.genres.includes(selectedGenre))
  //   : props.books

  const genres = new Set()
  props.books.forEach((book) => {
    book.genres.forEach((genre) => {
      genres.add(genre)
    })
  })

  return (
    <div>
      <h2>books</h2>
      {selectedGenre && (
        <p>
          in genre <strong>{selectedGenre}</strong>
        </p>
      )}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {data.allBooks.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
          {!selectedGenre &&
            props.books.map((book) => (
              <tr key={book.title}>
                <td>{book.title}</td>
                <td>{book.author.name}</td>
                <td>{book.published}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => setSelectedGenre('')}>all genres</button>
        {Array.from(genres).map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            style={{
              fontWeight: genre === selectedGenre ? 'bold' : 'normal',
            }}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Books
