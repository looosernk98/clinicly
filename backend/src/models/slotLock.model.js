import mongoose from "mongoose";

const slotLockSchema = new mongoose.Schema(
  {
    slot_key: { type: String, required: true, unique: true, trim: true, index: true },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
      index: true,
    },
    expires_at: { type: Date, required: true, index: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

slotLockSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0, name: "slot_lock_ttl_idx" });

const slotLockModel = mongoose.models.slot_lock || mongoose.model("slot_lock", slotLockSchema);
export default slotLockModel;
