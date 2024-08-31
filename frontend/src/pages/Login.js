import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';

const LOGIN_USER = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      username
      token
    }
  }
`;

const Login = () => {
  const [values, setValues] = useState({
    username: '',
    password: '',
  });
  const [login, { loading, error }] = useMutation(LOGIN_USER);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login({ variables: values });
     
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('userId', data.login.id);
      localStorage.setItem('username', data.login.username);
      
      navigate(`/users`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="register-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="username"
            placeholder='Username'
            value={values.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder='Password'
            value={values.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logining...' : 'Login'}
        </button>
        <Link to="/register">Register</Link>
      </form>
      {error && <p>{error.message}</p>}
    </div>
  );
};

export default Login;
