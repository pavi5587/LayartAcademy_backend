const mongoose = require("mongoose");

const enrollSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter Name"],
  },
  mobileNumber: {
    type: String,
    required: function () {
      return !this.isGoogleUser;
    },
  },
  course: {
    type: String,
  },
});

let schema = mongoose.model("Enroll", enrollSchema);

module.exports = schema;
