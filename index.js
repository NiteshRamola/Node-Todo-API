const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const auth = require('./routes/auth');
const todo = require('./routes/todo');

const app = express();
app.use(express.json());

if(!config.get('jwtPrivateKey')){
  console.error("JWT Private Key is not defined");
  process.exit(1);
}

app.use('/api/auth', auth);
app.use('/api/todo', todo);

mongoose.connect('mongodb://localhost/todo')
  .then(() => console.log("Connected to MongoDB..."))
  .catch(err => console.error("Something went wrong could not connect to MongoDB..."));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));