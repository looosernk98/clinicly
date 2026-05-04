import mongoose from "mongoose";

const doctorLeaveSchema = new mongoose.Schema(
  {
    doc_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
      index: true,
    },
    start_date: { type: Date, required: true, index: true },
    end_date: { type: Date, required: true, index: true },
    reason: { type: String, default: "", trim: true, maxlength: 500 },
    created_by: { type: String, enum: ["DOCTOR", "ADMIN"], required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

doctorLeaveSchema.index(
  { doc_id: 1, start_date: 1, end_date: 1 },
  { name: "doctor_leave_range_idx" },
);

const doctorLeaveModel =
  mongoose.models.doctor_leave || mongoose.model("doctor_leave", doctorLeaveSchema);

export default doctorLeaveModel;
