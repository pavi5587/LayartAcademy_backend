const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // PERSONAL DETAILS
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    // lastName: {
    //   type: String,
    //   required: [true, "Last name is required"],
    //   trim: true,
    //   minlength: 1,
    //   maxlength: 50,
    // },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },

    dateOfBirth: {
      type: String,
      required: [true, "Date of birth is required"],
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },

    photo: {
      type: String,
      default: "",
    },

    // COURSE DETAILS
    course: {
      type: String,
      required: [true, "Course is required"],
    },

    mode: {
      type: String,
      required: [true, "Learning mode is required"],
      enum: ["Online", "Offline", "Hybrid"],
    },

    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },

    qualification: {
      type: String,
      required: [true, "Qualification is required"],
    },

    // institution: {
    //   type: String,
    //   required: [true, "Institution name is required"],
    //   trim: true,
    // },

    // GUARDIAN DETAILS
    // guardianName: {
    //   type: String,
    //   required: [true, "Guardian name is required"],
    //   trim: true,
    // },

    // guardianRelation: {
    //   type: String,
    //   required: [true, "Guardian relation is required"],
    // },

    // guardianPhone: {
    //   type: String,
    //   required: [true, "Guardian phone number is required"],
    //   match: [/^[0-9]{10}$/, "Guardian phone must be 10 digits"],
    // },

    // EMERGENCY DETAILS
    // emergencyContact: {
    //   type: String,
    //   required: [true, "Emergency contact is required"],
    //   match: [/^[0-9]{10}$/, "Emergency contact must be 10 digits"],
    // },

    // emergencyRelation: {
    //   type: String,
    //   required: [true, "Emergency relation is required"],
    // },

    // IDENTITY
    aadhaar: {
      type: String,
      default: "",
      match: [/^[0-9]{12}$/, "Aadhaar number must be 12 digits"],
    },

    preferredLanguage: {
      type: String,
      required: [true, "Preferred language is required"],
    },

    // DISABILITY
    disability: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    disabilityDetails: {
      type: String,
      default: "",
    },

    // LOCATION
    location: {
      latitude: {
        type: String,
        required: [true, "Latitude is required"],
      },

      longitude: {
        type: String,
        required: [true, "Longitude is required"],
      },

      city: {
        type: String,
        required: [true, "City is required"],
      },

      state: {
        type: String,
        required: [true, "State is required"],
      },

      pin: {
        type: String,
        required: [true, "PIN code is required"],
        match: [/^[0-9]{6}$/, "PIN code must be 6 digits"],
      },

      address: {
        type: String,
        required: [true, "Address is required"],
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Student", studentSchema);
