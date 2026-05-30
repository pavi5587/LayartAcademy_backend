const express = require("express");
const moduleRouter = express.Router();
const moduleController = require("../controllers/moduleController");

moduleRouter.post("/", moduleController.addModule);
moduleRouter.get("/", moduleController.getModules);
moduleRouter.get("/course/:courseName", moduleController.getModulesByCourse); 
moduleRouter.put("/:id", moduleController.updateModule);
moduleRouter.delete("/:id", moduleController.deleteModule);


module.exports = moduleRouter;
