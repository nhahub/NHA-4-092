// Simple MongoDB Atlas connection using Mongoose.
// Reads the connection string from an environment variable only -
// there is no local/hard-coded database URL anywhere in this project.
const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env file (see .env.example)."
    );
  }

  await mongoose.connect(uri);
  isConnected = true;
  console.log("Connected to MongoDB Atlas");
}

module.exports = connectDB;
