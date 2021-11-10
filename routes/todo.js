const {Todo, validate} = require('../models/todo');
const mongoose = require('mongoose');
const express = require('express');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken')
const router = express.Router();

router.get('/', auth, async (req, res) => {
  const data = jwt.decode(req.header('x-auth-token'));
  const todos = await Todo.find({ user: data._id });
  res.send(todos);
});

router.post('/', auth, async (req, res) => {
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);
  const data = jwt.decode(req.header('x-auth-token'));

  let todo = new Todo({ task: req.body.task, detail: req.body.detail, user: data._id });
  todo = await todo.save();
  
  res.send(todo);
});

router.get('/:id', auth, async (req, res) => {
  const data = jwt.decode(req.header('x-auth-token'));
  const todo = await Todo.findById(req.params.id);

  if (!todo) return res.status(404).send('The task with the given ID was not found.');

  if(data._id !== todo.user.toString()) return res.status(403).send('You are not authorized to view this task');
  
  res.send(todo);
});


module.exports = router;