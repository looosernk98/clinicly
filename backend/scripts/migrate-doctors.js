/**
 * One-time migration: legacy doctor documents -> new schema (doctor.model.js).
 *
 * Usage:
 *   node scripts/migrate-doctors.js --dry-run    # print planned changes only
 *   node scripts/migrate-doctors.js              # apply migration
 *
 * Requires MONGODB_URI (same as app; DB name /prescripto is appended by connection).
 */
import "dotenv/config";
import mongoose from "mongoose";
import doctorModel from "../src/models/doctor.model.js";
import { splitFullNameToFirstLast } from "../src/utils/doctorName.util.js";

function logId(id) {
  if (id == null) return "unknown";
  if (typeof id.toHexString === "function") return id.toHexString();
  return String(id);
}

function applyNameFields(doc, $set, $unset) {
  if (!doc.name) return;
  if (!doc.first_name) {
    const { first_name, last_name } = splitFullNameToFirstLast(doc.name);
    $set.first_name = first_name;
    $set.last_name = last_name || "";
  }
  $unset.name = "";
}

function applyPasswordFields(doc, $set, $unset) {
  if (doc.password == null || doc.password_hash != null) return;
  $set.password_hash = doc.password;
  $unset.password = "";
}

function applySpecialityFields(doc, $set, $unset) {
  if (doc.speciality == null) return;
  if (doc.specialization == null) $set.specialization = doc.speciality;
  $unset.speciality = "";
}

function applyFeeAddressAvailability(doc, $set, $unset) {
  if (doc.fees !== undefined) {
    if (doc.consultation_fee == null) $set.consultation_fee = Number(doc.fees);
    $unset.fees = "";
  }
  if (doc.address != null) {
    if (doc.clinic_address == null) $set.clinic_address = doc.address;
    $unset.address = "";
  }
  if (doc.available !== undefined) {
    if (doc.is_profile_active == null) $set.is_profile_active = Boolean(doc.available);
    $unset.available = "";
  }
}

function applyDateAndMeta(doc, $set, $unset) {
  if (doc.date != null) {
    if (doc.created_at == null) $set.created_at = new Date(Number(doc.date));
    $unset.date = "";
  }
  if (doc.slots_booked !== undefined) {
    $unset.slots_booked = "";
  }
  if (doc.__v !== undefined) {
    $unset.__v = "";
  }
}

function applyDefaultsAfterChange(doc, $set, $unset) {
  const touched = Object.keys($set).length > 0 || Object.keys($unset).length > 0;
  if (!touched) return;
  if (doc.timezone == null && $set.timezone === undefined) $set.timezone = "UTC";
  if (doc.default_slot_duration == null && $set.default_slot_duration === undefined) {
    $set.default_slot_duration = 30;
  }
}

function buildMigrationOps(doc) {
  const $set = {};
  const $unset = {};

  applyNameFields(doc, $set, $unset);
  applyPasswordFields(doc, $set, $unset);
  applySpecialityFields(doc, $set, $unset);
  applyFeeAddressAvailability(doc, $set, $unset);
  applyDateAndMeta(doc, $set, $unset);

  const hasWork = Object.keys($set).length > 0 || Object.keys($unset).length > 0;
  if (hasWork) {
    applyDefaultsAfterChange(doc, $set, $unset);
  }

  return { $set, $unset, hasWork };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(`${uri}/prescripto`);

  const legacyFilter = {
    $or: [
      { name: { $exists: true } },
      { password: { $exists: true } },
      { speciality: { $exists: true } },
      { fees: { $exists: true } },
      { address: { $exists: true } },
      { available: { $exists: true } },
      { slots_booked: { $exists: true } },
      { date: { $exists: true } },
      { __v: { $exists: true } },
    ],
  };

  const cursor = doctorModel.find(legacyFilter).lean().cursor();
  let examined = 0;
  let migrated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    examined += 1;
    const { $set, $unset, hasWork } = buildMigrationOps(doc);
    if (!hasWork) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log("[dry-run]", logId(doc._id), { $set, $unset });
      migrated += 1;
      continue;
    }

    const update = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    await doctorModel.collection.updateOne({ _id: doc._id }, update);
    migrated += 1;
  }

  console.log(
    dryRun ? "Dry run complete." : "Migration complete.",
    { examined, migrated, skipped },
  );

  await mongoose.disconnect();
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
