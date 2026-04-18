import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "application_created",
        "status_updated",
        "email_sent",
        "support_message",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: "VisaApplication",
      required: false,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    visibility: {
      type: String,
      enum: ["admin", "user", "shared"],
      required: true,
      default: "shared",
    },
    subject: {
      type: String,
      default: "",
    },
    actorName: {
      type: String,
      default: null,
    },
    actorEmail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Activity =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);
