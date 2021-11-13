const { User } = require("../../models/user");
const request = require("supertest");
const bcrypt = require("bcrypt");

describe("/api/auth", () => {
  let server;
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(() => {
    server.close();
  });

  describe("POST /register", () => {
    let name, email, password;

    beforeEach(async () => {
      user = new User({
        name: "ramola",
        email: "nitesh@ab.com",
        password: "nitesh",
      });
      await user.save();
      name = "Nitesh";
      email = "nitesh@dk.com";
      password = "nitesh";
    });
    afterEach(async () => {
      await User.remove({});
    });

    const exec = () => {
      return request(server)
        .post("/api/auth/register")
        .send({ name, email, password });
    };

    it("should return 400 if name is less than 5 or password is also less than 6 characters", async () => {
      name = "1234";
      password = "1234";
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if name is more than 50 or password is more than 16 characters", async () => {
      name = new Array(52).join("a");
      password = new Array(18).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if invalid email is passed", async () => {
      email = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if email is already registered", async () => {
      email = "nitesh@ab.com";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should save user if it is valid", async () => {
      await exec();
      const user = await User.find({ email });
      expect(user).not.toBeNull();
    });

    it("should return user if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email", email);
      expect(res.body).toHaveProperty("name", name);
    });
  });

  describe("POST /login", () => {
    let email, password;

    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      user = new User({
        name: "ramola",
        email: "nitesh@ab.com",
        password: "nitesh",
      });
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();
      email = "nitesh@ab.com";
      password = "nitesh";
    });
    afterEach(async () => {
      await User.remove({});
    });

    const exec = () => {
      return request(server).post("/api/auth/login").send({ email, password });
    };

    it("should return 400 if email is not registered", async () => {
      email = "nitesh@fd.com";
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if invalid email is passed", async () => {
      email = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if invalid password is passed", async () => {
      password = "nitek";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return jwt token if right information is passed", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
    });
  });
});
