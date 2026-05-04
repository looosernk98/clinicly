/**
 * One-time migration: legacy `users` collection → `patients` (same Mongoose model as user.model.js).
 *
 * Preserves `_id` so JWT `id`, `appointment.user_id`, and other refs stay valid.
 *
 * Verification (run in order):
 *   1. Backup DB (e.g. mongodump) before any apply.
 *   2. node scripts/migrate-users-to-patients.js --dry-run
 *   3. node scripts/migrate-users-to-patients.js
 *   4. Smoke test: patient login, profile, booking, admin appointments populate.
 *   5. Only after counts look correct: node scripts/migrate-users-to-patients.js --drop-users
 *      (drops `users` — destructive; run without other flags in same invocation as apply, see below.)
 *
 * Usage:
 *   node scripts/migrate-users-to-patients.js --dry-run
 *   node scripts/migrate-users-to-patients.js
 *   node scripts/migrate-users-to-patients.js --drop-users   # apply migration then drop `users`
 *
 * Requires MONGODB_URI (same as app; DB name /prescripto is appended by connection).
 */
import "dotenv/config";
import mongoose from "mongoose";
import { splitFullNameToFirstLast } from "../src/utils/doctorName.util.js";
import { mapPatientGender, parsePatientDob } from "../src/utils/patient.util.js";

function logId(id) {
  if (id == null) return "unknown";
  if (typeof id.toHexString === "function") return id.toHexString();
  return String(id);
}

function buildPatientDocument(legacy) {
  let first_name = legacy.first_name;
  let last_name = legacy.last_name ?? "";
  if (!first_name && legacy.name) {
    const split = splitFullNameToFirstLast(legacy.name);
    first_name = split.first_name;
    last_name = split.last_name ?? "";
  }
  if (!first_name || String(first_name).trim() === "") {
    first_name = "Unknown";
    last_name = last_name || "";
  }

  const password_hash = legacy.password_hash ?? legacy.password;
  if (!password_hash || typeof password_hash !== "string") {
    return { error: "missing password_hash/password" };
  }

  const email = legacy.email != null ? String(legacy.email).trim().toLowerCase() : "";
  if (!email) {
    return { error: "missing email" };
  }

  const doc = {
    _id: legacy._id,
    first_name: String(first_name).trim().slice(0, 80),
    last_name: String(last_name ?? "").trim().slice(0, 80),
    email,
    password_hash,
    image: legacy.image != null ? String(legacy.image) : "",
    address:
      legacy.address != null && typeof legacy.address === "object" && !Array.isArray(legacy.address)
        ? legacy.address
        : {},
    gender: mapPatientGender(legacy.gender),
    dob: parsePatientDob(legacy.dob),
    no_show_count:
      typeof legacy.no_show_count === "number" && legacy.no_show_count >= 0
        ? legacy.no_show_count
        : 0,
  };

  if (legacy.phone != null && String(legacy.phone).trim() !== "") {
    doc.phone = String(legacy.phone).trim().slice(0, 30);
  }

  const createdAt = legacy.created_at ?? legacy.createdAt ?? legacy.date;
  const updatedAt = legacy.updated_at ?? legacy.updatedAt;
  if (createdAt != null) {
    const c = new Date(createdAt);
    if (!Number.isNaN(c.getTime())) doc.created_at = c;
  }
  if (updatedAt != null) {
    const u = new Date(updatedAt);
    if (!Number.isNaN(u.getTime())) doc.updated_at = u;
  }

  const now = new Date();
  if (!doc.created_at) doc.created_at = now;
  if (!doc.updated_at) doc.updated_at = doc.created_at;

  return { doc };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const dropUsers = process.argv.includes("--drop-users");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(`${uri}/prescripto`);
  const db = mongoose.connection.db;
  const usersCol = db.collection("users");
  const patientsCol = db.collection("patients");

  const userCount = await usersCol.countDocuments({});
  let examined = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  const cursor = usersCol.find({});

  for await (const legacy of cursor) {
    examined += 1;
    const emailNorm =
      legacy.email != null ? String(legacy.email).trim().toLowerCase() : "";

    const emailConflict = await patientsCol.findOne({
      email: emailNorm,
      _id: { $ne: legacy._id },
    });
    if (emailConflict) {
      console.warn("[skip email conflict]", logId(legacy._id), "email", emailNorm, "held by", logId(emailConflict._id));
      skipped += 1;
      continue;
    }

    const existing = await patientsCol.findOne({ _id: legacy._id });
    if (existing && existing.first_name && String(existing.first_name).trim() !== "") {
      console.log("[skip existing patient]", logId(legacy._id));
      skipped += 1;
      continue;
    }

    const built = buildPatientDocument(legacy);
    if (built.error) {
      console.warn("[skip]", logId(legacy._id), built.error);
      skipped += 1;
      continue;
    }

    const { doc } = built;

    if (dryRun) {
      console.log("[dry-run]", logId(legacy._id), {
        email: doc.email,
        first_name: doc.first_name,
        last_name: doc.last_name,
        has_password_hash: Boolean(doc.password_hash),
      });
      migrated += 1;
      continue;
    }

    try {
      await patientsCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
      migrated += 1;
    } catch (e) {
      console.error("[error]", logId(legacy._id), e.message);
      errors += 1;
    }
  }

  console.log(dryRun ? "Dry run complete." : "Migration complete.", {
    usersCollectionCount: userCount,
    examined,
    migrated,
    skipped,
    errors,
  });

  if (dropUsers && !dryRun) {
    if (errors > 0) {
      console.error("--drop-users aborted: fix errors and re-run migration first.");
    } else {
      try {
        const dropped = await usersCol.drop();
        if (dropped === false) {
          console.log("Collection users did not exist (nothing to drop).");
        } else {
          console.log("Dropped collection: users");
        }
      } catch (e) {
        console.error("Drop users failed:", e.message);
      }
    }
  } else if (dropUsers && dryRun) {
    console.log("[dry-run] would not drop users; run without --dry-run to apply and drop.");
  }

  await mongoose.disconnect();
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
