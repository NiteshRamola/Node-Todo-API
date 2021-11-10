const jwt = require('jsonwebtoken')
const config = require('config')

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if(!token) return res.status(401).send('Access Denied. No token provided');

  try{
    const payload = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = payload;
    next();
  } catch(err){
    res.status(400).send('Access Denied. Invalid Token');
  }
} 

module.exports = auth;