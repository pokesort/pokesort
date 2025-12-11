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

export const connect = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { bufferCommands: false })
      .then((mongooseInstance) => {
        return mongooseInstance.connection.useDb(process.env.DB_NAME);
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error("Error connecting to MongoDB:", err);
    throw err;
  }

  console.log("> Conectado ao MongoDB:", cached.conn.name);
  return cached.conn;
};

export const getDb = () => {
  if (!cached.conn || cached.conn.readyState !== 1) {
    throw new Error("MongoDB connection is not ready. Call connect() first.");
  }
  return cached.conn;
};

export const getReadyState = () => {
  return cached.conn?.readyState ?? 0;
};