import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
if (!process.env.DB_NAME) {
  throw new Error('Invalid/Missing environment variable: "DB_NAME"');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let ready = 0;
let data = null;

const connect = async () => {
  if (cached.conn) {
    return;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.log("Error connecting to MongoDB: ", error);
    throw error;
  }

  ready = cached.conn.connection.readyState;
  data = cached.conn.connection.useDb(process.env.DB_NAME);
  console.log("> Conectado ao MongoDB: " + data.name);
};

export { connect, data, ready };