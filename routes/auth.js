const { User, validate } = require("../models/user");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");
const config = require("config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const Joi = require("joi");
const router = express.Router();

// Login the user
router.post("/login", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).send({ error: "Invalid email or password" });

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send({ error: "Invalid email or password" });

  const token = user.generateAuthToken();
  res.send({ jwtToken: token });
});

// Create a new user
router.post("/register", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res
      .status(400)
      .send({ error: "User with this email already registered" });

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send({ id: user._id, name: user.name, email: user.email });
});

const validateUser = (req) => {
  const schema = {
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  };
  return Joi.validate(req, schema);
};

module.exports = router;
