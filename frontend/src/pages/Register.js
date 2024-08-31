import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';

const REGISTER_USER = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      id
      username
      token
    }
  }
`;

const Register = () => {
  const [values, setValues] = useState({
    username: '',
    password: '',
  });
  const [register, { loading, error }] = useMutation(REGISTER_USER);
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
      const { data } = await register({ variables: values });
  
      localStorage.setItem('token', data.register.token);
      localStorage.setItem('userId', data.register.id);
      localStorage.setItem('username', data.register.username);
      navigate(`/users`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="register-page">
      <h1>Register</h1>
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
          {loading ? 'Registering...' : 'Register'}
        </button>
        <Link to="/login">Login</Link>
      </form>
      {error && <p>{error.message}</p>}
    </div>
  );
};

export default Register;
