import { auth } from "../lib/auth.ts";
import { Feedback } from "../models/feedback.model.ts";
import type { Request, Response } from "express";



export const createFeedback = async (req: Request, res: Response) => {

    try {

        const { role, country, feedBack: message, rating } = req.body;

        if (!role || !country || !message || !rating) {

            res.status(400).json({ message: "Missing Fields" })
            throw new Error("Missing Fields");

        }

        // get Session.user 
        const session = await auth.api.getSession({
            headers: req.headers as any
        });
        // 
        if (!session) return res.status(500).json({
            message: "no Session was Found"
        });
        // 
        const userId = session.user.id;

        const feedBack = await Feedback.create({


            role,
            country,
            feedBack: message,
            rating,
            user: userId,

        });


        res.status(201).json({ message: "Feedback Noted successfully", feedBack });




    } catch (e) {
        res.status(500).json({
            message: "Error Creating feedBack"
        })
        console.log(e)
    }

};

// get all feedbacks
export const getFeedbacks = async (req: Request, res: Response) => {

    try {


        const feedBacks = await Feedback.find()
            .populate("user", "name")
            .lean();

        if (!feedBacks) return res.status(500).json({ message: "Internal Server error" })

        res.status(200).json(feedBacks);

    } catch (e: any) {

        res.status(500).json({
            message: "Server Error"
        });
        console.error(e.message);


    }

}



