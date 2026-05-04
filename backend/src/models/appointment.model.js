import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
      index: true,
    },
    doc_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
      index: true,
    },
    slot_date: { type: String, required: true, trim: true, index: true },
    start_time: { type: String, required: true, trim: true },
    end_time: { type: String, required: true, trim: true },
    consultation_fee: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: ["virtual", "clinic"], default: "clinic" },
    payment: {
      type: String,
      enum: ["pending", "partial", "completed"],
      default: "pending",
      set: (value) => {
        if (value === true) return "completed";
        if (value === false) return "pending";
        return value;
      },
    },
    status: {
      type: String,
      enum: ["booked", "no_show", "completed", "cancelled"],
      default: "booked",
      index: true,
    },
    cancelled_by: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN", "SYSTEM"],
      default: null,
    },
    cancelled_by_actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: "", trim: true, maxlength: 500 },
    cancelled: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    rescheduled_from: { type: mongoose.Schema.Types.ObjectId, ref: "appointment", default: null },
    created_by: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN", "SYSTEM"],
      default: "PATIENT",
    },
    updated_by: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN", "SYSTEM"],
      default: "PATIENT",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

appointmentSchema.index({ doc_id: 1, slot_date: 1, start_time: 1 }, { unique: true });

appointmentSchema.pre("save", function syncLegacyFlags(next) {
  if (this.cancelled) this.status = "cancelled";
  if (this.isCompleted) this.status = "completed";

  if (this.status === "cancelled") this.cancelled = true;
  if (this.status === "completed") this.isCompleted = true;

  if (this.status !== "cancelled") {
    this.cancelled_by = null;
    this.cancelled_by_actor_id = null;
    this.cancelled_at = null;
    this.cancellation_reason = "";
  } else if (!this.cancelled_at) {
    this.cancelled_at = new Date();
  }
  next();
});

appointmentSchema.set("toJSON", { virtuals: false });
appointmentSchema.set("toObject", { virtuals: false });

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
