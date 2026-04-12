import mongoose from "mongoose";



const feeedBackSchema = new mongoose.Schema({

  
    role: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    feedBack: {
        type: String,
        required: true,
        min: 20,
        max: 150,

    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    highlight: {
        type: Boolean,
        default: false,
    },
    //Relations
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true


    }

}, {
    timestamps: true
})

export const Feedback = mongoose.model("Feedback", feeedBackSchema);