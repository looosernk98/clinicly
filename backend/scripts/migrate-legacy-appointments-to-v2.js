/**
 * One-time migration: legacy appointment docs → v2 appointment schema.
 *
 * Legacy shape seen in DB:
 *   { userId, docId, slotDate, slotTime, amount, date, payment: boolean, cancelled, isCompleted, userData, docData, ... }
 *
 * V2 shape:
 *   { patient_id, doc_id, slot_date, start_time, end_time, consultation_fee, payment, status, created_at, updated_at, ... }
 *
 * Notes:
 * - Preserves `_id` and converts `payment` boolean → string enum.
 * - Sets `status` based on {cancelled,isCompleted} when present.
 *
 * Usage:
 *   node scripts/migrate-legacy-appointments-to-v2.js --dry-run
 *   node scripts/migrate-legacy-appointments-to-v2.js
 *
 * Requires MONGODB_URI (same as app; DB name /prescripto is appended by connection).
 */
import "dotenv/config";
import mongoose from "mongoose";

function logId(id) {
  if (id == null) return "unknown";
  if (typeof id.toHexString === "function") return id.toHexString();
  return String(id);
}

function addMinutesToTimeString(timeStr, minutesToAdd) {
  const parts = String(timeStr || "").split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(timeStr || "");
  let totalMinutes = h * 60 + m + minutesToAdd;
  totalMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function mapPayment(value) {
  if (value === true) return "completed";
  if (value === false) return "pending";
  if (typeof value === "string") return value;
  return "pending";
}

function mapStatus(doc) {
  const cancelled = Boolean(doc.cancelled);
  const completed = Boolean(doc.isCompleted);
  if (cancelled) return "cancelled";
  if (completed) return "completed";
  return "booked";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(`${uri}/prescripto`);
  const db = mongoose.connection.db;
  const apptCol = db.collection("appointments");

  // Legacy docs: have userId/docId but do not have patient_id/doc_id.
  const filter = { userId: { $exists: true }, patient_id: { $exists: false } };
  const count = await apptCol.countDocuments(filter);
  console.log(dryRun ? "[dry-run] matches" : "Matches", count);

  const cursor = apptCol.find(filter);
  let examined = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for await (const legacy of cursor) {
    examined += 1;

    const patientId = legacy.patient_id ?? legacy.user_id ?? legacy.userId;
    const doctorId = legacy.doc_id ?? legacy.docId;
    const slotDate = legacy.slot_date ?? legacy.slotDate;
    const startTime = legacy.start_time ?? legacy.slotTime;
    if (!patientId || !doctorId || !slotDate || !startTime) {
      console.warn("[skip missing fields]", logId(legacy._id));
      skipped += 1;
      continue;
    }

    const consultationFee =
      legacy.consultation_fee ??
      legacy.amount ??
      legacy.fees ??
      0;

    const status = mapStatus(legacy);
    const payment = mapPayment(legacy.payment);

    const createdAtRaw = legacy.created_at ?? legacy.createdAt ?? legacy.date;
    const createdAt = createdAtRaw != null ? new Date(createdAtRaw) : new Date();
    const created_at = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;

    const update = {
      $set: {
        patient_id: typeof patientId === "string" ? new mongoose.Types.ObjectId(patientId) : patientId,
        doc_id: typeof doctorId === "string" ? new mongoose.Types.ObjectId(doctorId) : doctorId,
        slot_date: String(slotDate),
        start_time: String(startTime),
        end_time: legacy.end_time ?? addMinutesToTimeString(startTime, 30),
        consultation_fee: Number(consultationFee) || 0,
        mode: legacy.mode || "clinic",
        payment,
        status,
        cancelled: status === "cancelled",
        isCompleted: status === "completed",
        created_at,
        updated_at: legacy.updated_at ? new Date(legacy.updated_at) : created_at,
        created_by: legacy.created_by || "PATIENT",
        updated_by: legacy.updated_by || "PATIENT",
      },
      $unset: {
        userId: "",
        docId: "",
        slotDate: "",
        slotTime: "",
        amount: "",
        userData: "",
        docData: "",
        date: "",
        __v: "",
      },
    };

    if (dryRun) {
      console.log("[dry-run]", logId(legacy._id), {
        patient_id: logId(update.$set.patient_id),
        doc_id: logId(update.$set.doc_id),
        slot_date: update.$set.slot_date,
        start_time: update.$set.start_time,
        status: update.$set.status,
        payment: update.$set.payment,
      });
      migrated += 1;
      continue;
    }

    try {
      await apptCol.updateOne({ _id: legacy._id }, update);
      migrated += 1;
    } catch (e) {
      console.error("[error]", logId(legacy._id), e.message);
      errors += 1;
    }
  }

  console.log(dryRun ? "Dry run complete." : "Migration complete.", {
    examined,
    migrated,
    skipped,
    errors,
  });

  await mongoose.disconnect();
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

