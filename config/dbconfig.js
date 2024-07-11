const mongoose = require("mongoose");

const connect = mongoose.connect(process.env.MONGODB_URL);

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("MongoDB connected");
});

connection.on("error", (error) => {
  console.log("MongoDB connection error: " + error);
});

module.exports = mongoose;