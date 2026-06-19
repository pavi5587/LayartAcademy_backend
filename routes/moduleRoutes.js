const express = require("express");
const moduleRouter = express.Router();
const moduleController = require("../controllers/moduleController");
const authenticateToken = require("../middleware/auth");

moduleRouter.post("/", authenticateToken, moduleController.addModule);
moduleRouter.get("/", moduleController.getModules);
moduleRouter.get("/course/:courseName", moduleController.getModulesByCourse); 
moduleRouter.put("/:id", authenticateToken, moduleController.updateModule);
moduleRouter.delete("/:id", authenticateToken, moduleController.deleteModule);


module.exports = moduleRouter;
