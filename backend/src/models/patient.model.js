import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
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
    password_hash: { type: String, required: true },
    image: { type: String, default: "" },
    address: { type: mongoose.Schema.Types.Mixed, default: {} },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },
    dob: { type: Date, default: null },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    no_show_count: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

patientSchema.virtual("name").get(function getName() {
  const lastNamePart = this.last_name ? ` ${this.last_name}` : "";
  return `${this.first_name}${lastNamePart}`.trim();
});

patientSchema.virtual("password")
  .get(function getPassword() {
    return this.password_hash;
  })
  .set(function setPassword(value) {
    this.password_hash = value;
  });

// Age is derived from dob and exposed as a virtual.
patientSchema.virtual("age").get(function getAge() {
  if (!this.dob) return null;
  const dob = new Date(this.dob);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  const dayDiff = now.getUTCDate() - dob.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
});

patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

const patientModel = mongoose.models.patient || mongoose.model("patient", patientSchema);

export default patientModel;

