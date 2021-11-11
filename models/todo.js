const Joi = require('joi');
const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50
  },
  detail: {
    type: String,
    minlength: 5,
    maxlength: 255,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false,
  }
});

const Todo = mongoose.model('Todo', todoSchema);

const validateTodo = (todo) => {
  const schema = {
    task: Joi.string().min(5).max(50).required(),
    detail: Joi.string().min(5).max(255),
  };

  return Joi.validate(todo, schema);
}

exports.Todo = Todo; 
exports.validate = validateTodo;