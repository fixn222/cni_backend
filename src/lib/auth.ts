import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv'
import { sendResetPasswordEmail, sendVerificationCodeEmail, sendVerificationEmail } from "./mailer.ts";
dotenv.config()

const normalizeOrigin = (value?: string | null) => {
    if (!value) {
        return null;
    }

    try {
        return new URL(value).origin;
    } catch {
        return value.replace(/\/$/, "");
    }
}

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db()
const authBasePath = "/api/auth";
const configuredBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:8000";
const normalizedBaseUrl = configuredBaseUrl.endsWith(authBasePath)
    ? configuredBaseUrl
    : `${configuredBaseUrl.replace(/\/$/, "")}${authBasePath}`;
const frontendOrigin = normalizeOrigin(process.env.FRONT_END_URL);
const isProduction = process.env.NODE_ENV === "production";


export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: normalizedBaseUrl,
    basePath: authBasePath,

    database: mongodbAdapter(db, {
        client,
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        resetPasswordTokenExpiresIn: 60 * 60,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            await sendResetPasswordEmail({
                to: user.email,
                name: user.name,
                url,
            });
        },
    } ,
    emailVerification: {
        sendOnSignUp: false,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
        expiresIn: 60 * 60 * 24,
        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail({
                to: user.email,
                name: user.name,
                url,
            });
        },
    },
    trustedOrigins : [frontendOrigin].filter((origin): origin is string => Boolean(origin)),
    advanced: {
        useSecureCookies: isProduction,
        defaultCookieAttributes: isProduction
            ? {
                sameSite: "none",
                secure: true,
            }
            : undefined,
    },
    plugins: [
        emailOTP({
            expiresIn: 60 * 10,
            otpLength: 6,
            allowedAttempts: 5,
            sendVerificationOnSignUp: true,
            overrideDefaultEmailVerification: true,
            sendVerificationOTP: async ({ email, otp, type }) => {
                await sendVerificationCodeEmail({
                    to: email,
                    otp,
                    type,
                });
            },
        }),
    ],
     session : {
        cookieCache :{
            enabled : true ,
            maxAge : 60 * 60
        }
    },
})


// export async function getSession() {


    
// }
