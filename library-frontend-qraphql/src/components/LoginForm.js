import { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN, ME } from '../queries'
import { useApolloClient } from '@apollo/client'



const LoginForm = ({ show, setToken, setError }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [login, { data }] = useMutation(LOGIN)

  const client = useApolloClient()


  useEffect(() => {
    if (data && data.login && data.login.value) {
      const token = data.login.value
      setToken(token)
      localStorage.setItem('login-user-token', token)
      loginCacheUpdate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, setToken]) 

  const loginCacheUpdate = async () => {
    try {
      await client.resetStore()
      const { data: { me } } = await client.query({ query: ME })
      client.writeQuery({ query: ME, data: { me } })
    } catch (error) {
      console.error('Error updating cache:', error)
    }
  }
//   useEffect(() => {
//     if (data) {
//         console.log(data)
//       const token = data.login.value
//       setToken(token)
//       localStorage.setItem('login-user-token', token)
//     }
//   }, [data])

  const submit = (event) => {
    event.preventDefault()

    login({ variables: { username, password } })
  }

  if (!show) {
    return null
  }

  return (
    <form onSubmit={submit}>
      <div>
        username{' '}
        <input
          value={username}
          onChange={({ target }) => setUsername(target.value)}
        />
      </div>
      <div>
        password{' '}
        <input
          type="password"
          value={password}
          onChange={({ target }) => setPassword(target.value)}
        />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}

export default LoginForm
