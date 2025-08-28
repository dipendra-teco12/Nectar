// models/Location.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const pointSchema = new Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
});

const locationSchema = new Schema({
  name: String,
  location: {
    type: pointSchema,
    required: true,
    index: "2dsphere", // Enables geospatial queries
  },
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
