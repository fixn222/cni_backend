import express, { Router } from "express";
import dotenv from "dotenv"
// import authRoute from "./routes/auth.route.ts"
import { connectDB } from "./config/db.ts";
import { auth } from "./lib/auth.ts";
import {toNodeHandler} from "better-auth/node"
import cors from 'cors'
import { getSession } from "./routes/session.ts";


dotenv.config()

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

connectDB();


app.use(cors({
 origin : process.env.FRONT_END_URL , //your frontend
 credentials : true
}))

app.get("/api/auth/session" , getSession);
app.use("/api/auth/*splat" , toNodeHandler(auth));





app.listen(PORT , ()=>{
console.log(`Server started at port http://localhost:${PORT}`);
})
