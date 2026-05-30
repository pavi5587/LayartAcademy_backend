const express = require("express");
const userRouter = express.Router();

const {
  getUser,
  postUser,
  getAllUsers,
} = require("../controllers/userController");

userRouter.post("/login", getUser);
userRouter.post("/register", postUser);
userRouter.get("/users", getAllUsers);

module.exports = userRouter;
