import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    registrationNo: {
      type: String,
    //   required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },

    industry: {
      type: String,
    //   required: [true, "Industry is required"],
      trim: true,
    },

    phone: {
      type: String,
    //   required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid phone number"],
    },

    email: {
      type: String,
    //   required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email address",
      ],
    },

    address: {
      type: String,
    //   required: [true, "Address is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", companySchema);
export default Company;