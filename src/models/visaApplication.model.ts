import mongoose, { Schema, Document } from "mongoose";

//InterFace
export interface VisaApplictaionDocument extends Document {
    user: mongoose.Types.ObjectId;
    country : mongoose.Types.ObjectId;
    clientDetails: {
        fullName: String
        passportNumber: String
        nationality: String
        dateofBirth?: Date

    };

    visaDetails: {
        visaType: String,
        purpose: String,
        travelDate: Date,
        duration: Number,
        notes?: String
    };
    status: "pending" | "approved" | "rejected";
}

const visaApplictaionSchema = new Schema<VisaApplictaionDocument>(
    {
        //RELATIONS
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
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
                required: false
            }
        },
        //APPLICATION DETAILS
        visaDetails: {
            visaType: {
                type: String,
                required: true
            },
            purpose: {
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
                required: false,
                default: ""
            },
        }
        ,
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        }
    },
    {
        timestamps: true
    }
)

export const VisaApplication = mongoose.model<VisaApplictaionDocument>("VisaApplication", visaApplictaionSchema);
