import express from "express";
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
import adminRoutes from "./routes/admin.route.ts"
dotenv.config()


const app = express();
const PORT = process.env.PORT;
const normalizedAllowedOrigins = (process.env.FRONT_END_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
        try {
            return new URL(origin).origin;
        } catch {
            return origin.replace(/\/$/, "");
        }
    });

app.use(express.json());



app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = (() => {
            try {
                return new URL(origin).origin;
            } catch {
                return origin.replace(/\/$/, "");
            }
        })();

        if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
}))

app.get("/api/auth/session", getSession);
app.use("/api/auth/*splat", toNodeHandler(auth));
app.use('/api/countries', countryRoutes)
app.use("/api/feedback/" , feedBackRoutes );
app.use("/api/application/" , applicationRoutes )
app.use("/api/applications", applicationRoutes)
app.use("/api/admin", adminRoutes)





app.listen(PORT, () => {
    connectDB();

    console.log(`Server started at port http://localhost:${PORT}`);
})
