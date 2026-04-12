import express, { Router } from "express";
import dotenv from "dotenv"
// import authRoute from "./routes/auth.route.ts"
import { connectDB } from "./config/db.ts";
import { auth } from "./lib/auth.ts";
import { toNodeHandler } from "better-auth/node"
import cors from 'cors'
import { getSession } from "./routes/session.ts";
import countryRoutes from "./routes/country.route.ts"
import feedBackRoutes from "./routes/feeback.route.ts"
import applicationRoutes from "./routes/applictaion.route.ts"
import { User } from "./models/user.model.ts";




dotenv.config()


const app = express();
const PORT = process.env.PORT;

app.use(express.json());



app.use(cors({
    origin: process.env.FRONT_END_URL, //your frontend
    credentials: true
}))

app.get("/api/auth/session", getSession);
app.use("/api/auth/*splat", toNodeHandler(auth));
app.use('/api/countries', countryRoutes)
app.use("/api/feedback/" , feedBackRoutes );
app.use("/api/application/" , applicationRoutes )





app.listen(PORT, () => {
    connectDB();

    console.log(`Server started at port http://localhost:${PORT}`);
})
