import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

var ready = 0;

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    ready = mongoose.connection.readyState;
    console.log("Connected to MongoDB ("+mongoose.connection.db.databaseName+")");
  } catch (error) {
    console.log("Error connecting to MongoDB: ", error);
  }
};

const data = mongoose.connection.useDb("pokesort-test");

export { connect, data, ready };