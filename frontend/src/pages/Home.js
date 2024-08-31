import React from 'react'
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ margin: '10px' }}>
      <h1>Welcome to the Chat App</h1>
      {/* <Link to="/register">Register</Link> <br /> */}
      <Link to="/users">Find Friends</Link>
    </div>
  )
}

export default Home;