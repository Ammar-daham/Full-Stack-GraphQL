import { useState, useEffect } from 'react'
import { EDIT_BIRTH_YEAR, ALL_AUTHORS } from '../queries'
import { useMutation } from '@apollo/client'
import Select from 'react-select'

const Authors = (props) => {
  const [born, setBorn] = useState('')
  const [error, setError] = useState('')
  
  const options = [
    ...props.authors.map((author) => ({ value: author.name, label: author.name })),
  ]
  const [selectedName, setSelectedName] = useState(options[0])

  const [changeBirthyear, result] = useMutation(EDIT_BIRTH_YEAR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  })

  const submit = (event) => {
    event.preventDefault()
    changeBirthyear({ variables: { name: selectedName.value, born: Number(born) } })
    setBorn('')
  }

  useEffect(() => {
    if (result.data && result.data.editNumber === null) {
      setError('person not found')
    }
  }, [result.data])

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {props.authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Set birth year</h2>
      <form onSubmit={submit}>
        <div className="App">
          <Select
            defaultValue={selectedName}
            onChange={setSelectedName}
            options={options}
          />
        </div>
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  )
}

export default Authors
