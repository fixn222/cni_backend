import mongoose, { Schema, Document } from "mongoose";

//InterFace
export interface VisaApplictaionDocument extends Document {
    user: mongoose.Types.ObjectId;
    clientDetails: {
        fullName: String
        passportNumber: String
        nationality: String
        dateofBirth: Date

    };
    visaDetails: {
        visaType: String,
        travelPurpose: String,
        travelDate: Date,
        duration: Number,
        notes?: String
    };
    status: "pending" | "approved" | "rejected";
}

const visaApplictaionSchema = new Schema<VisaApplictaionDocument>(
    {
        //RELATION
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        //CLIENT DETAILS
        clientDetails: {
            fullName: {
                type: String,
                required: true
            },
            passportNumber: {
                type: String,
                required: true
            },
            nationality: {
                type: String,
                required: true
            },
            dateofBirth: {
                type: Date,
                required: true
            }
        },
        //APPLICATION DETAILS
        visaDetails: {
            visaType: {
                type: String,
                required: true
            },
            travelPurpose: {
                type: String,
                required: true
            },
            travelDate: {
                type: Date,
                required: true
            },
            duration: {
                type: String,
                required: true
            },
            notes: {
                type: String,
                required: true
            },

        }
    }
)

export const VisaApplictaion = mongoose.model<VisaApplictaionDocument>("VisaApplication", visaApplictaionSchema);