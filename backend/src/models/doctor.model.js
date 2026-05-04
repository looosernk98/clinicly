import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
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
    specialization: { type: String, required: true, trim: true, maxlength: 120 },
    degree: { type: String, required: true, trim: true, maxlength: 120 },
    experience: { type: String, required: true, trim: true, maxlength: 120 },
    about: { type: String, required: true, trim: true, maxlength: 3000 },
    is_profile_active: { type: Boolean, default: true, index: true },
    timezone: { type: String, default: "UTC" },
    default_slot_duration: { type: Number, default: 30, min: 5, max: 240 },
    consultation_fee: { type: Number, required: true, min: 0 },
    clinic_address: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

doctorSchema.virtual("name").get(function getName() {
  const lastNamePart = this.last_name ? ` ${this.last_name}` : "";
  return `${this.first_name}${lastNamePart}`.trim();
});

doctorSchema.virtual("password")
  .get(function getPassword() {
    return this.password_hash;
  })
  .set(function setPassword(value) {
    this.password_hash = value;
  });

doctorSchema.virtual("speciality")
  .get(function getSpeciality() {
    return this.specialization;
  })
  .set(function setSpeciality(value) {
    this.specialization = value;
  });

doctorSchema.virtual("available")
  .get(function getAvailable() {
    return this.is_profile_active;
  })
  .set(function setAvailable(value) {
    this.is_profile_active = value;
  });

doctorSchema.virtual("fees")
  .get(function getFees() {
    return this.consultation_fee;
  })
  .set(function setFees(value) {
    this.consultation_fee = value;
  });

doctorSchema.virtual("address")
  .get(function getAddress() {
    return this.clinic_address;
  })
  .set(function setAddress(value) {
    this.clinic_address = value;
  });

doctorSchema.set("toJSON", { virtuals: true });
doctorSchema.set("toObject", { virtuals: true });

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;
