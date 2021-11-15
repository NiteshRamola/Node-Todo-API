const jwtDecoder = require("../../middleware/jwtDecoder");
const { User } = require("../../models/user");
const mongoose = require("mongoose");

describe("JWT Decoder", () => {
  it("should return null if invalid token is passed", () => {
    const token = 1;
    const result = jwtDecoder(token);

    expect(result).toBe(null);
  });

  it("should decode the JWT token and return payload", () => {
    const payload = {
      _id: new mongoose.Types.ObjectId().toHexString(),
    };

    const user = new User(payload);
    const token = user.generateAuthToken();
    const result = jwtDecoder(token);

    expect(result).toMatchObject(payload);
  });
});
