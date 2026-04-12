import { auth } from "../lib/auth.ts";
import type { Request, Response } from "express";
import { VisaApplictaion } from "../models/visaApplication.model.ts";




//create an Apllication
export const createApplication = async (req: Request, res: Response) => {
    try {
        if (!req.body.clientDetails || !req.body.visaDetails)
            return res.status(404).json({ message: "Missing fields" });

        const session = await auth.api.getSession()
        if (!session) return res.status(404).json({ message: "session not found" });

        const userId = session.user.id;


        const application = await VisaApplictaion.create({
            user: userId,
            clientDetails: req.body.clientDetails,
            visaDetails: req.body.visaDetails,

        });

        res.status(201).json({ application });


    } catch (error: any) {

        console.error(error.message);
        res.status(500).json({ message: error.message });

    }
};

//