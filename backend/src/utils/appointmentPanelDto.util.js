/**
 * DTO mapping for admin/doctor appointment lists.
 * Returns only the new keys and a single patientData/docData block.
 */
function idString(ref) {
  if (ref == null) return null;
  if (typeof ref === "object" && ref._id != null) return String(ref._id);
  return String(ref);
}

export function mapAppointmentPanelDto(item) {
  const patient = item.patient_id;
  const doctor = item.doc_id;
  const plain = item.toObject({ virtuals: false });

  return {
    ...plain,
    patient_id: idString(patient),
    doc_id: idString(doctor),
    patientData:
      patient && typeof patient === "object" && patient._id != null
        ? {
            _id: patient._id,
            image: patient.image || "",
            name: `${patient.first_name || ""} ${patient.last_name || ""}`.trim(),
            dob: patient.dob,
            age: patient.age ?? null,
          }
        : null,
    docData:
      doctor && typeof doctor === "object" && doctor._id != null
        ? {
            _id: doctor._id,
            image: doctor.image || "",
            name: `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim(),
          }
        : null,
  };
}

