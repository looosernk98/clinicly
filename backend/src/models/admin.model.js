import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true, maxlength: 80 },
    last_name: { type: String, trim: true, maxlength: 80, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      index: true,
    },
    password_hash: { type: String, required: true, select: false },
    image: { type: String, default: "" },
    phone: { type: String, default: "", trim: true, maxlength: 20 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);
export default adminModel;
