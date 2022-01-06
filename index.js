require("express-async-errors");
const express = require("express");
const config = require("config");
const mongoose = require("mongoose");
const auth = require("./routes/auth");
const todo = require("./routes/todo");
const errors = require("./middleware/errors");
var cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

if (!config.get("jwtPrivateKey")) {
  console.error("JWT Private Key is not defined");
  process.exit(1);
}

process.on("uncaughtException", (e) => {
  console.log(e.message);
});

process.on("unhandledRejection", (e) => {
  console.log(e.message);
});

app.use(errors);
app.use("/api/auth", auth);
app.use("/api/todo", todo);

mongoose
  .connect(config.get("db"))
  .then(() => console.log(`Connected to ${config.get("db")}...`));

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Listening on port ${port}...`)
);

module.exports = server;
