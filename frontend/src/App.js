import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';

import Home from './pages/Home'
import Register from './pages/Register';
import Login from './pages/Login';
import Users from './pages/Users'

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        }
      />
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      </Routes>
    </Router>
  );
}

export default App;
