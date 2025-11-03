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

const connect = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
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

  const conn = cached.conn.connection.useDb(process.env.DB_NAME);
  console.log("> Conectado ao MongoDB: " + conn.name);
  return cached.conn;
};

const getDb = () => {
  const active = cached?.conn ?? mongoose;
  const connection = active?.connection;
  if (!connection || connection.readyState !== 1) {
    throw new Error("MongoDB connection is not ready. Call connect() first.");
  }
  return connection.useDb(process.env.DB_NAME);
};

const getReadyState = () => {
  const active = cached?.conn ?? mongoose;
  return active?.connection?.readyState ?? 0;
};

export { connect, getDb, getReadyState };