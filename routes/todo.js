const { Todo, validate } = require("../models/todo");
const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middleware/auth");
const Joi = require("joi");
const router = express.Router();
const jwtDecoder = require("../middleware/jwtDecoder");
const validateObjectId = require("../middleware/validateObjectId");

// Get All Todos
router.get("/", auth, async (req, res) => {
  const data = jwtDecoder(req.header("x-auth-token"));
  const todos = await Todo.find({ user: data._id });
  res.send(todos);
});

// Get All Completed Todos
router.get("/completed", auth, async (req, res) => {
  const data = jwtDecoder(req.header("x-auth-token"));
  const todos = await Todo.find({ user: data._id, isCompleted: true });
  res.send(todos);
});

// Get All Pending Todos
router.get("/pending", auth, async (req, res) => {
  const data = jwtDecoder(req.header("x-auth-token"));
  const todos = await Todo.find({ user: data._id, isCompleted: false });
  res.send(todos);
});

// Create New Todos
router.post("/", [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const data = jwtDecoder(req.header("x-auth-token"));

  let todo = new Todo({
    task: req.body.task,
    detail: req.body.detail,
    user: data._id,
  });
  todo = await todo.save();

  res.send(todo);
});

// Get Todo by ID
router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const data = jwtDecoder(req.header("x-auth-token"));
  const todo = await Todo.findById(req.params.id);

  if (!todo)
    return res.status(404).send("The task with the given ID was not found.");

  if (data._id !== todo.user.toString())
    return res.status(403).send("You are not authorized to view this task");

  res.send(todo);
});

// Update Todo
router.put("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const data = jwtDecoder(req.header("x-auth-token"));
  const todo = await Todo.findById(req.params.id);

  if (!todo)
    return res.status(404).send("The task with the given ID was not found.");
  if (data._id !== todo.user.toString())
    return res.status(403).send("You are not authorized to update this task.");

  todo.task = req.body.task;
  todo.detail = req.body.detail;
  todo.save();

  res.send(todo);
});

// Mark task as complete/uncomplete
router.patch("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validateTodo(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const data = jwtDecoder(req.header("x-auth-token"));
  const todo = await Todo.findById(req.params.id);

  if (!todo)
    return res.status(404).send("The task with the given ID was not found.");
  if (data._id !== todo.user.toString())
    return res.status(403).send("You are not authorized.");

  todo.isCompleted = !todo.isCompleted;
  todo.save();

  res.send(todo);
});

// Validation function for patch request
function validateTodo(todo) {
  const schema = {};
  return Joi.validate(todo, schema);
}

module.exports = router;
