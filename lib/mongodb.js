import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

var ready = 0;

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    ready = mongoose.connection.readyState;
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error);
  }
};

const data = mongoose.connection.useDb(process.env.DB_NAME);

export { connect, data, ready };