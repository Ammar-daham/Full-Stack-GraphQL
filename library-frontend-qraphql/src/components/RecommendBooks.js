import { useEffect, useState } from 'react'

const RecommendBooks = (props) => {
  const [favoriteGenre, setFavoriteGenre] = useState('')

  useEffect(() => {
    if(props.user.me !== null) {
        setFavoriteGenre(props.user.me.favoriteGenre)
    }
  }, [props.user])

  if (!props.show ) {
    return null
  }

  const booksToShow = favoriteGenre
    ? props.books.filter((book) => book.genres.includes(favoriteGenre))
    : props.books

  console.log('books: ', booksToShow)

  return (
    <div>
      <h2>Recommendations</h2>
      {favoriteGenre && (
        <p>
          Books in your favorite genre <strong>{favoriteGenre}</strong>
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
    </div>
  )
}

export default RecommendBooks
