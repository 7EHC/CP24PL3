import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userModel from "../models/user.model.js";
import appError from "../middleware/appError.js"
export const registerUserService = async (username, password) => {
  const oldUser = await userModel.findUserByUsername(username);
  if (oldUser) {
    throw new appError("User already exists. Please login", 409); // ✅ ใช้ AppError
  }

  const encryptedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    username,
    password: encryptedPassword,
    createdAt: new Date().toISOString(),
  };

  const result = await userModel.createUser(newUser);
  const token = jwt.sign(
    { user_id: result.insertedId, username },
    process.env.TOKEN_KEY,
    { expiresIn: "1d" }
  );

  newUser.token = token;
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginUserService = async (username, password) => {
  const user = await userModel.findUserByUsername(username);
  if (!user) {
    throw new appError("username notfound", 404); // ✅ ใช้ AppError
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new appError("wrong password", 400); // ✅ ใช้ AppError
  }

  const token = jwt.sign(
    { user_id: user._id, username },
    process.env.TOKEN_KEY,
    { expiresIn: "1d" }
  );
  user.token = token;
  const { password: pwd, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
