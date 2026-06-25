const express = require("express");
const enrollRouter = express.Router();

const { getAllEnroll, postEnroll } = require("../controllers/enrollController");

enrollRouter.post("/", postEnroll);
enrollRouter.get("/", getAllEnroll);

module.exports = enrollRouter;
