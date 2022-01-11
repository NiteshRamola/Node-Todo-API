const { User, validate } = require("../models/user");
const { OAuth2Client } = require("google-auth-library");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const config = require("config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const Joi = require("joi");
const { response } = require("express");
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

// Register/Login with Google

const clientId =
  "748780046331-8o6fsppq677ba0pqhaggv7ds55h5kon6.apps.googleusercontent.com";
const client = new OAuth2Client(clientId);

router.post("/google", (req, res) => {
  const { tokenId } = req.body;

  client
    .verifyIdToken({ idToken: tokenId, audience: clientId })
    .then(async (response) => {
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        let user = await User.findOne({ email: email });
        if (user) {
          const token = user.generateAuthToken();
          res.send({ jwtToken: token });
        } else {
          let password = Math.random().toString(36).slice(2);
          user = new User({
            name,
            email,
            password,
          });
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);

          await user.save();

          const token = user.generateAuthToken();
          res.send({ jwtToken: token });
        }
      }
    });
});

// Login/Register with Facebook

router.post("/facebook", (req, res) => {
  const { userID, accessToken } = req.body;
  let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;

  fetch(urlGraphFacebook, {
    method: "GET",
  })
    .then((response = response.json()))
    .then((response) => {
      const { email, name } = response;

      let user = await User.findOne({ email: email });
      if (user) {
        const token = user.generateAuthToken();
        res.send({ jwtToken: token });
      } else {
        let password = Math.random().toString(36).slice(2);
        user = new User({
          name,
          email,
          password,
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();

        const token = user.generateAuthToken();
        res.send({ jwtToken: token });
      }
    });
});

const validateUser = (req) => {
  const schema = {
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  };
  return Joi.validate(req, schema);
};

module.exports = router;
