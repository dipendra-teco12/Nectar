const mongoose = require("mongoose");
require("dotenv").config({ quiet: true });
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB successfully connected to", mongoose.connection.host);
  } catch (error) {
    console.error("MongoDB Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDb;
