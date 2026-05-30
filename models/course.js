const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Digital Marketing"
  level: { type: String, required: true },
  price: { type: Number, required: true }, // discounted price
  created: { type: Date, default: Date.now },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  reviews: [reviewSchema],
  category: { type: String, required: true }, // e.g. "Marketing", "Design"
  description: String,
  instructor: String,
  rating: { type: Number, min: 1, max: 5 },
  ratingCount: Number, // e.g. 3021
  lessons: Number, // e.g. 163
  duration: String, // e.g. "42h 10m"
  students: Number, // e.g. 18900
  originalPrice: { type: Number, required: true }, // original price before discount
  certificateIncluded: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  lastUpdated: Date,
  language: [String], // e.g. ["English", "Tamil"]
  location: String, // e.g. "Coimbatore, Tamil Nadu"
  tags: [String], // e.g. ["SEO", "Google Ads", "Meta Ads"]
  topicsCovered: { type: String }, // e.g. "30+ Topics Covered"
  trainingType: { type: String }, // e.g. "100% Practical Training"
  courseTitle: { type: String }, 
  avgRating: { type: String }, // e.g. "4.8 ★"
  studentsEnrolled: { type: String }, // e.g. "8,412+ Students Enrolled"
  image: { type: String },
});

let schema = mongoose.model("Course", courseSchema);

module.exports = schema;
