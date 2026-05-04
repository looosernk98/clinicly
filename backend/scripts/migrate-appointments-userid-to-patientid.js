/**
 * One-time migration: appointments.user_id → appointments.patient_id
 *
 * Keeps the same ObjectId value; only renames the field.
 *
 * Usage:
 *   node scripts/migrate-appointments-userid-to-patientid.js --dry-run
 *   node scripts/migrate-appointments-userid-to-patientid.js
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

  const filter = { user_id: { $exists: true }, patient_id: { $exists: false } };
  const count = await apptCol.countDocuments(filter);
  console.log(dryRun ? "[dry-run] matches" : "Matches", count);

  if (dryRun) {
    const sample = await apptCol
      .find(filter, { projection: { _id: 1, user_id: 1, doc_id: 1, slot_date: 1 } })
      .limit(20)
      .toArray();
    for (const s of sample) {
      console.log("[dry-run]", logId(s._id), {
        user_id: logId(s.user_id),
        doc_id: logId(s.doc_id),
        slot_date: s.slot_date,
      });
    }
    await mongoose.disconnect();
    return;
  }

  const res = await apptCol.updateMany(filter, { $rename: { user_id: "patient_id" } });
  console.log("Migration complete.", {
    matched: res.matchedCount,
    modified: res.modifiedCount,
  });

  await mongoose.disconnect();
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

