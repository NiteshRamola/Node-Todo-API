const request = require("supertest");
const { Todo } = require("../../models/todo");
const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

describe("/api/todo", () => {
  let server;
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(() => {
    server.close();
  });

  describe("GET /", () => {
    let token;
    let userID;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      userID = jwt.decode(token);
      await Todo.collection.insertMany([
        {
          task: "task1",
          detail: "detail1",
          user: mongoose.Types.ObjectId(userID._id),
        },
        {
          task: "task2",
          detail: "detail2",
          user: mongoose.Types.ObjectId(userID._id),
        },
      ]);
    });

    afterEach(async () => {
      await Todo.remove({});
    });

    const exec = () => {
      return request(server).get("/api/todo").set("x-auth-token", token);
    };

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return all todos for that user", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe("GET /pending", () => {
    let token;
    let userID;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      userID = jwt.decode(token);
      await Todo.collection.insertMany([
        {
          task: "task1",
          detail: "detail1",
          user: mongoose.Types.ObjectId(userID._id),
          isCompleted: true,
        },
        {
          task: "task2",
          detail: "detail2",
          user: mongoose.Types.ObjectId(userID._id),
          isCompleted: false,
        },
      ]);
    });

    afterEach(async () => {
      await Todo.remove({});
    });

    const exec = () => {
      return request(server)
        .get("/api/todo/pending")
        .set("x-auth-token", token);
    };

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return all pending todos for that user", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body.some((g) => g.isCompleted === false)).toBeTruthy();
    });
  });

  describe("GET /completed", () => {
    let token;
    let userID;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      userID = jwt.decode(token);
      await Todo.collection.insertMany([
        {
          task: "task1",
          detail: "detail1",
          user: mongoose.Types.ObjectId(userID._id),
          isCompleted: true,
        },
        {
          task: "task2",
          detail: "detail2",
          user: mongoose.Types.ObjectId(userID._id),
          isCompleted: false,
        },
      ]);
    });

    afterEach(async () => {
      await Todo.remove({});
    });

    const exec = () => {
      return request(server)
        .get("/api/todo/completed")
        .set("x-auth-token", token);
    };

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return all completed todos for that user", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body.some((g) => g.isCompleted === true)).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    let token;
    let user;
    let todo;
    let id;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      user = jwt.decode(token);
      todo = new Todo({
        task: "task1",
        detail: "detail1",
        user: mongoose.Types.ObjectId(user._id),
      });
      await todo.save();
      id = todo._id;
    });

    afterEach(async () => {
      await Todo.remove({});
    });

    const exec = () => {
      return request(server).get(`/api/todo/${id}`).set("x-auth-token", token);
    };

    it("should return 401 if user is not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 404 if invalid id is passed", async () => {
      id = 1;
      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 403 if user is not authorized", async () => {
      token = new User().generateAuthToken();
      const res = await exec();

      expect(res.status).toBe(403);
    });

    it("should return todo with the given id", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("task", "task1");
      expect(res.body).toHaveProperty("detail", "detail1");
      expect(res.body).toHaveProperty("user", user._id);
      expect(res.body).toHaveProperty("_id", todo._id.toHexString());
    });
  });

  describe("POST /", () => {
    let token;
    let task, detail;
    const exec = () => {
      return request(server)
        .post("/api/todo")
        .set("x-auth-token", token)
        .send({ task, detail });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      task = "task1";
      detail = "detail1";
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 400 if task is less than 5 or detail is also less than 5 characters", async () => {
      task = "1234";
      detail = "1234";
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if task is more than 50 or detail is more than 255 characters", async () => {
      task = new Array(52).join("a");
      detail = new Array(258).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should save task if it is valid", async () => {
      await exec();
      const task = await Todo.find({ task: "task1" });
      expect(task).not.toBeNull();
    });

    it("should return task if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("task", "task1");
    });
  });

  describe("PUT /:id", () => {
    let token;
    let newTask, newDetail;
    let todo;
    let id;

    const exec = async () => {
      return await request(server)
        .put(`/api/todo/${id}`)
        .set("x-auth-token", token)
        .send({ task: newTask, detail: newDetail });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();
      userID = jwt.decode(token);
      todo = new Todo({
        task: "task1",
        detail: "detail1",
        user: mongoose.Types.ObjectId(userID._id),
      });
      await todo.save();
      id = todo._id;
      newTask = "updatedTask";
      newDetail = "updatedDetail";
    });

    afterEach(async () => {
      await Todo.remove({});
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 400 if task is less than 5 or detail is less than 5 characters", async () => {
      newTask = "1234";
      newDetail = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if task is more than 50 or detail is more than 255 characters", async () => {
      newTask = new Array(52).join("a");
      newDetail = new Array(258).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 404 if id is invalid", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 404 if todo with the given id was not found", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should update the todo if input is valid", async () => {
      await exec();

      const updatedTodo = await Todo.findById(todo._id);

      expect(updatedTodo.task).toBe(newTask);
    });

    it("should return the updated todo if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("task", newTask);
    });
  });

  describe("PATCH /:id", () => {
    let token;
    let todo;
    let id;

    const exec = async () => {
      return await request(server)
        .patch(`/api/todo/${id}`)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();
      userID = jwt.decode(token);
      todo = new Todo({
        task: "task1",
        detail: "detail1",
        user: mongoose.Types.ObjectId(userID._id),
        isCompleted: false,
      });
      await todo.save();
      id = todo._id;
    });

    afterEach(async () => {
      await Todo.remove({});
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 404 if id is invalid", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 404 if todo with the given id was not found", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should update the todo-isCompleted if id is found", async () => {
      await exec();
      const updatedTodo = await Todo.findById(todo._id);

      expect(updatedTodo.isCompleted).toBe(!todo.isCompleted);
    });

    it("should return the updated todo if it is valid", async () => {
      const res = await exec();

      expect(res.body.isCompleted).toBe(true);
    });
  });
});
