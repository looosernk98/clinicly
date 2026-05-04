import mongoose from "mongoose";

const doctorBlockSchema = new mongoose.Schema(
  {
    doc_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
      index: true,
    },
    date: { type: String, required: true, trim: true, index: true },
    start_time: { type: String, required: true, trim: true },
    end_time: { type: String, required: true, trim: true },
    reason: { type: String, default: "", trim: true, maxlength: 500 },
    created_by: { type: String, enum: ["DOCTOR", "ADMIN"], required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

doctorBlockSchema.index(
  { doc_id: 1, date: 1, start_time: 1, end_time: 1 },
  { name: "doctor_block_lookup_idx" },
);

const doctorBlockModel =
  mongoose.models.doctor_block || mongoose.model("doctor_block", doctorBlockSchema);

export default doctorBlockModel;
