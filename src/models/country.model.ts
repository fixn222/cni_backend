import mongoose, { Schema, Document } from "mongoose";

export interface CountryDocument extends Document {
  code: string;
  name: string;
  visaType: string[];
  image: string;
  flag: string;
  popular?: boolean;
  selected?: boolean;
}

const countrySchema = new Schema<CountryDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, //  normalize
    },

    name: {
      type: String,
      required: true,
    },

    visaType: [
      {
        type: String,
        required: true,
      },
    ],

    image: {
      type: String,
      required: true,
    },

    flag: {
      type: String,
      required: true,
    },

    popular: {
      type: Boolean,
      default: false,
    },

    selected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Country = mongoose.model<CountryDocument>(
  "Country",
  countrySchema
);