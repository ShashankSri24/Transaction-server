import { config } from "dotenv";
import mongoose from "mongoose";
config();
const uri = process.env.MONGO_URL;

export const DatabaseConnect = async () => {
  try {
    const connect = await mongoose.connect(uri);
 
    console.log("Database connected successfully");
  } catch (error) {
    console.log("something went wrong", error);
  }
};
