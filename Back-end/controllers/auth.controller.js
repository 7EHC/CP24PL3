import * as authService from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw { statusCode: 400, message: "All input is required" };
    }
    const user = await authService.registerUserService(username, password);
    res.status(201).json(user);
  } catch (error) {
    next(error); // ✅ ให้ Middleware จัดการ Error
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw { statusCode: 400, message: "All input is required" };
    }
    const user = await authService.loginUserService(username, password);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
