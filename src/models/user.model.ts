 import mongoose from "mongoose";

  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      emailVerified: { type: Boolean, default: false },
      image: { type: String, default: null },
      createdAt: { type: Date },
      updatedAt: { type: Date },
    },
    {
      collection: "user",
      timestamps: false,
    },
  );
  export const User = mongoose.models.User || mongoose.model("User", userSchema);