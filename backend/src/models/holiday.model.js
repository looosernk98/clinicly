import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    clinic_id: { type: String, default: null, trim: true, index: true },
    is_global: { type: Boolean, default: false, index: true },
    reason: { type: String, default: "", trim: true, maxlength: 500 },
    created_by: { type: String, enum: ["ADMIN"], default: "ADMIN" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

holidaySchema.index({ date: 1, clinic_id: 1, is_global: 1 }, { name: "holiday_lookup_idx" });

const holidayModel = mongoose.models.holiday || mongoose.model("holiday", holidaySchema);

export default holidayModel;
