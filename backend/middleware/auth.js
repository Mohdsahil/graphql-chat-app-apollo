const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;  

const generateToken = (user) => {
    return jwt.sign({
      id: user.id,
      username: user.username,
    }, SECRET_KEY, { expiresIn: '1day' });
};

// Middleware to authenticate token
const authenticateToken = (connectionParams) => {
    const authentication = connectionParams;
  
    if (authentication) {
      const token = authentication.split('Bearer ')[1];
  
      if (token) {
        try {
          const user = jwt.verify(token, SECRET_KEY);
          console.log(":user:", user)
          return user;
        } catch (err) {
          throw new Error('Invalid/Expired token');
        }
      }
  
      throw new Error('Authentication token must be \'Bearer [token]');
    }
  
    throw new Error('Authorization header must be provided');
  };
  

module.exports = {
    generateToken,
    authenticateToken
}