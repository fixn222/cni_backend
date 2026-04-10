import mongoose from "mongoose";

export const connectDB = async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);

        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error("Database connection faild " , error);
        process.exit(1);
    }
}