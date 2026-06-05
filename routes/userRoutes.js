const express = require("express");
const userRouter = express.Router();

const {
  getUser,
  postUser,
  getAllUsers,
  googleLogin,
  googleRegister,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

userRouter.post("/login", getUser);
userRouter.post("/register", postUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/google-register", googleRegister);
userRouter.get("/users", getAllUsers);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

module.exports = userRouter;
