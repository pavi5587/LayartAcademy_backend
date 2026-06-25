const Enroll = require("../models/enroll");

const postEnroll = async (req, res) => {
  const { name, mobileNumber, course } = req.body;

  try {
    const newEnroll = new Enroll({
      name,
      course,
      mobileNumber,
    });

    await newEnroll.save();
    res.status(201).json({ message: "User Registered" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ message: "Error Registering User" });
  }
};

const getAllEnroll = async (req, res) => {
  try {
    const enroll = await Enroll.find();
    res.json(enroll);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

module.exports = {
  postEnroll,
  getAllEnroll,
};
