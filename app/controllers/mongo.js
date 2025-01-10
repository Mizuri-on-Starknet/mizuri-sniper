import mongoose from "mongoose";
import dotenv from "dotenv";
import Pusher from "pusher";
dotenv.config();
const env = process.env;

const MONGO_URI = env.MONGO_URI;

export const MongoConnect = async () => {
  try {
    console.log("trying to connect to MongoDB -------");
    await mongoose.connect(MONGO_URI);
    console.log("=====================================");
    console.log("Connected to MongoDB");
    console.log("=====================================");
  } catch (error) {
    console.error("MongoDB Connection Error: ", error);
    process.exit(1);
  }
};

export const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.PUSHER_CLUSTER,
  useTLS: true
});
