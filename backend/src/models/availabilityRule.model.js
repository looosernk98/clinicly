import mongoose from "mongoose";

const availabilityRuleSchema = new mongoose.Schema(
  {
    doc_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
      index: true,
    },
    day_of_week: { type: Number, required: true, min: 0, max: 6 },
    start_time: { type: String, required: true, trim: true },
    end_time: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true, index: true },
    slot_duration: { type: Number, default: 30, min: 5, max: 240 },
    buffer_duration: { type: Number, default: 0, min: 0, max: 120 },
    effective_from: { type: Date, default: null, index: true },
    effective_to: { type: Date, default: null, index: true },
    timezone: { type: String, default: "UTC" },
    created_by: {
      type: String,
      enum: ["DOCTOR", "ADMIN", "SYSTEM"],
      default: "DOCTOR",
    },
    updated_by: {
      type: String,
      enum: ["DOCTOR", "ADMIN", "SYSTEM"],
      default: "DOCTOR",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

availabilityRuleSchema.index(
  { doc_id: 1, day_of_week: 1, start_time: 1, end_time: 1, effective_from: 1 },
  { name: "availability_rule_lookup_idx" },
);

const availabilityRuleModel =
  mongoose.models.availability_rule ||
  mongoose.model("availability_rule", availabilityRuleSchema);

export default availabilityRuleModel;
