const jwt = require("jsonwebtoken");

// JWT Decoder function
module.exports = (token) => {
  return jwt.decode(token);
};
