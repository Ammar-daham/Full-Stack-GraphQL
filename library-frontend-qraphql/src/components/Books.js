import { useState } from 'react'

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState('')

  
  if (!props.show) {
    return null
  }

  const booksToShow = selectedGenre
    ? props.books.filter((book) => book.genres.includes(selectedGenre))
    : props.books

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
          {booksToShow.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
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
        <button onClick={() => setSelectedGenre('')}>all genres</button>
      </div>
    </div>
  )
}

export default Books
