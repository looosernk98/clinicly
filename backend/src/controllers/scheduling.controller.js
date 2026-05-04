import mongoose from "mongoose";
import appointmentModel from "../models/appointment.model.js";
import availabilityRuleModel from "../models/availabilityRule.model.js";
import doctorBlockModel from "../models/doctorBlock.model.js";
import doctorLeaveModel from "../models/doctorLeave.model.js";
import holidayModel from "../models/holiday.model.js";
import slotLockModel from "../models/slotLock.model.js";

const APPOINTMENT_STATUS = {
  BOOKED: "booked",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

const toMinutes = (timeText) => {
  const [h, m] = String(timeText || "")
    .split(":")
    .map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
};

const toTimeText = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const isValidDateText = (dateText) => /^\d{4}-\d{2}-\d{2}$/.test(String(dateText || ""));

const dateRangeForDay = (dateText) => {
  const from = new Date(`${dateText}T00:00:00.000Z`);
  const to = new Date(`${dateText}T23:59:59.999Z`);
  return { from, to };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

const makeSlotKey = ({ doctorId, date, startTime, endTime }) =>
  `${doctorId}:${date}:${startTime}-${endTime}`;

const getDayOfWeekUTC = (dateText) => {
  const parsed = new Date(`${dateText}T00:00:00.000Z`);
  return parsed.getUTCDay();
};

const appointmentEndAtUTC = (appointment) => {
  const baseDate = appointment.slot_date;
  const endTime = appointment.end_time;
  return new Date(`${baseDate}T${endTime}:00.000Z`);
};

const findHoliday = async ({ date, clinicId }) => {
  const { from, to } = dateRangeForDay(date);
  const query = {
    date: { $gte: from, $lte: to },
    $or: [{ is_global: true }, { clinic_id: clinicId || null }, { clinic_id: clinicId || "" }],
  };
  return holidayModel.findOne(query);
};

const findDoctorLeave = async ({ doctorId, date }) => {
  const target = new Date(`${date}T00:00:00.000Z`);
  return doctorLeaveModel.findOne({
    doc_id: doctorId,
    start_date: { $lte: target },
    end_date: { $gte: target },
  });
};

const getDaySlots = async ({ doctorId, date, clinicId }) => {
  const now = new Date();
  const todayUTC = now.toISOString().slice(0, 10);
  if (String(date) < todayUTC) {
    return { slots: [], meta: { reason: "past_date" } };
  }

  const holiday = await findHoliday({ date, clinicId });
  if (holiday) {
    return { slots: [], meta: { reason: "holiday" } };
  }

  const leave = await findDoctorLeave({ doctorId, date });
  if (leave) {
    return { slots: [], meta: { reason: "doctor_leave" } };
  }

  const dayOfWeek = getDayOfWeekUTC(date);
  const { from, to } = dateRangeForDay(date);

  const [rules, blocks, appointments, locks] = await Promise.all([
    availabilityRuleModel
      .find({
        doc_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: true,
        $and: [
          { $or: [{ effective_from: null }, { effective_from: { $lte: to } }] },
          { $or: [{ effective_to: null }, { effective_to: { $gte: from } }] },
        ],
      })
      .sort({ start_time: 1 }),
    doctorBlockModel.find({ doc_id: doctorId, date }),
    appointmentModel.find({
      doc_id: doctorId,
      slot_date: date,
      status: { $in: [APPOINTMENT_STATUS.BOOKED, APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.NO_SHOW] },
    }),
    slotLockModel.find({ expires_at: { $gt: new Date() } }),
  ]);

  const baseSlots = [];

  rules.forEach((rule) => {
    const start = toMinutes(rule.start_time);
    const end = toMinutes(rule.end_time);
    if (start === null || end === null || end <= start) return;

    const duration = Number(rule.slot_duration || 30);
    const buffer = Number(rule.buffer_duration || 0);
    const jump = duration + buffer;
    if (duration <= 0 || jump <= 0) return;

    for (let cursor = start; cursor + duration <= end; cursor += jump) {
      baseSlots.push({
        date,
        startTime: toTimeText(cursor),
        endTime: toTimeText(cursor + duration),
      });
    }
  });

  const blockRanges = blocks
    .map((b) => ({ start: toMinutes(b.start_time), end: toMinutes(b.end_time) }))
    .filter((b) => b.start !== null && b.end !== null && b.end > b.start);

  const appointmentRanges = appointments
    .map((a) => ({ start: toMinutes(a.start_time), end: toMinutes(a.end_time) }))
    .filter((a) => a.start !== null && a.end !== null && a.end > a.start);

  const lockKeys = new Set(locks.map((l) => l.slot_key));

  const slots = baseSlots.filter((slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    if (slotStart === null || slotEnd === null || slotEnd <= slotStart) return false;

    if (String(date) === todayUTC) {
      const slotStartAt = new Date(`${date}T${slot.startTime}:00.000Z`);
      if (slotStartAt.getTime() <= now.getTime()) return false;
    }

    const blocked = blockRanges.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
    if (blocked) return false;

    const booked = appointmentRanges.some((a) => overlaps(slotStart, slotEnd, a.start, a.end));
    if (booked) return false;

    const slotKey = makeSlotKey({
      doctorId,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    return !lockKeys.has(slotKey);
  });

  return { slots, meta: { reason: "available" } };
};

export const createAvailabilityRule = async (req, res) => {
  try {
    const doctorId = req.body.docId;
    const {
      day_of_week,
      start_time,
      end_time,
      slot_duration = 30,
      buffer_duration = 0,
      timezone = "UTC",
      is_active = true,
      effective_from = null,
      effective_to = null,
    } = req.body;

    if (!validateObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor id" });
    }
    if (!Number.isInteger(Number(day_of_week)) || Number(day_of_week) < 0 || Number(day_of_week) > 6) {
      return res.status(400).json({ success: false, message: "day_of_week must be between 0 and 6" });
    }

    const rule = await availabilityRuleModel.create({
      doc_id: doctorId,
      day_of_week: Number(day_of_week),
      start_time,
      end_time,
      slot_duration: Number(slot_duration),
      buffer_duration: Number(buffer_duration),
      timezone,
      is_active: Boolean(is_active),
      effective_from: effective_from ? new Date(`${effective_from}T00:00:00.000Z`) : null,
      effective_to: effective_to ? new Date(`${effective_to}T23:59:59.999Z`) : null,
      created_by: "DOCTOR",
      updated_by: "DOCTOR",
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAvailabilityRule = async (req, res) => {
  try {
    const doctorId = req.body.docId;
    const { id } = req.params;
    if (!validateObjectId(doctorId) || !validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const updateData = {};
    const allowedFields = [
      "day_of_week",
      "start_time",
      "end_time",
      "slot_duration",
      "buffer_duration",
      "timezone",
      "is_active",
      "effective_from",
      "effective_to",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    if (updateData.effective_from !== undefined) {
      updateData.effective_from = updateData.effective_from
        ? new Date(`${updateData.effective_from}T00:00:00.000Z`)
        : null;
    }
    if (updateData.effective_to !== undefined) {
      updateData.effective_to = updateData.effective_to
        ? new Date(`${updateData.effective_to}T23:59:59.999Z`)
        : null;
    }
    updateData.updated_by = "DOCTOR";

    const updated = await availabilityRuleModel.findOneAndUpdate(
      { _id: id, doc_id: doctorId },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Availability rule not found" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAvailabilityRule = async (req, res) => {
  try {
    const doctorId = req.body.docId;
    const { id } = req.params;
    if (!validateObjectId(doctorId) || !validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const deleted = await availabilityRuleModel.findOneAndUpdate(
      { _id: id, doc_id: doctorId },
      { is_active: false, updated_by: "DOCTOR" },
      { new: true },
    );

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Availability rule not found" });
    }

    res.json({ success: true, message: "Availability rule soft-deleted", data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctorLeave = async (req, res) => {
  try {
    const doctorId = req.body.docId;
    const { startDate, endDate, reason = "" } = req.body;

    if (!validateObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor id" });
    }

    const leave = await doctorLeaveModel.create({
      doc_id: doctorId,
      start_date: new Date(`${startDate}T00:00:00.000Z`),
      end_date: new Date(`${endDate}T23:59:59.999Z`),
      reason,
      created_by: "DOCTOR",
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctorBlock = async (req, res) => {
  try {
    const doctorId = req.body.docId;
    const { date, startTime, endTime, reason = "" } = req.body;
    if (!validateObjectId(doctorId) || !isValidDateText(date)) {
      return res.status(400).json({ success: false, message: "Invalid doctorId/date" });
    }

    const block = await doctorBlockModel.create({
      doc_id: doctorId,
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      created_by: "DOCTOR",
    });

    res.status(201).json({ success: true, data: block });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorSlots = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const date = req.query.date;
    const clinicId = req.query.clinicId;

    if (!validateObjectId(doctorId) || !isValidDateText(date)) {
      return res.status(400).json({ success: false, message: "doctor id and date are required" });
    }

    const result = await getDaySlots({ doctorId, date, clinicId });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const patientId = req.body.userId;
    const { doctorId, date, startTime, endTime, mode = "clinic" } = req.body;

    if (!validateObjectId(patientId) || !validateObjectId(doctorId) || !isValidDateText(date)) {
      return res.status(400).json({ success: false, message: "Invalid patient/doctor/date" });
    }

    const requestedStartAt = new Date(`${date}T${startTime}:00.000Z`);
    if (Number.isNaN(requestedStartAt.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid startTime" });
    }
    if (requestedStartAt.getTime() < Date.now()) {
      return res.status(409).json({ success: false, message: "Cannot book an appointment in the past" });
    }

    const dayResult = await getDaySlots({ doctorId, date, clinicId: req.body.clinicId });
    const matchedSlot = dayResult.slots.find((s) => s.startTime === startTime && s.endTime === endTime);
    if (!matchedSlot) {
      return res.status(409).json({ success: false, message: "Slot not available" });
    }

    const slot_key = makeSlotKey({ doctorId, date, startTime, endTime });
    const lockDoc = await slotLockModel.create({
      slot_key,
      patient_id: patientId,
      expires_at: new Date(Date.now() + 2 * 60 * 1000),
    });

    try {
      const appointment = await appointmentModel.create({
        patient_id: patientId,
        doc_id: doctorId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        mode,
        consultation_fee: Number(req.body.consultationFee || 0),
        status: APPOINTMENT_STATUS.BOOKED,
        created_by: "PATIENT",
        updated_by: "PATIENT",
      });

      await slotLockModel.deleteOne({ _id: lockDoc._id });
      return res.status(201).json({ success: true, data: appointment });
    } catch (innerError) {
      await slotLockModel.deleteOne({ _id: lockDoc._id });
      if (innerError?.code === 11000) {
        return res.status(409).json({ success: false, message: "Slot already booked" });
      }
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const patientId = req.body.userId;
    const appointmentId = req.params.id;
    const { date, startTime, endTime } = req.body;

    if (!validateObjectId(patientId) || !validateObjectId(appointmentId) || !isValidDateText(date)) {
      return res.status(400).json({ success: false, message: "Invalid ids/date" });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment || String(appointment.patient_id) !== String(patientId)) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return res.status(409).json({ success: false, message: "Cancelled appointment cannot be rescheduled" });
    }

    const doctorId = String(appointment.doc_id);
    const dayResult = await getDaySlots({ doctorId, date, clinicId: req.body.clinicId });
    const matchedSlot = dayResult.slots.find((s) => s.startTime === startTime && s.endTime === endTime);
    if (!matchedSlot) {
      return res.status(409).json({ success: false, message: "New slot not available" });
    }

    const slot_key = makeSlotKey({ doctorId, date, startTime, endTime });
    const lockDoc = await slotLockModel.create({
      slot_key,
      patient_id: patientId,
      expires_at: new Date(Date.now() + 2 * 60 * 1000),
    });

    try {
      appointment.slot_date = date;
      appointment.start_time = startTime;
      appointment.end_time = endTime;
      appointment.status = APPOINTMENT_STATUS.BOOKED;
      appointment.updated_by = "PATIENT";
      await appointment.save();
      await slotLockModel.deleteOne({ _id: lockDoc._id });
      return res.json({ success: true, data: appointment });
    } catch (innerError) {
      await slotLockModel.deleteOne({ _id: lockDoc._id });
      if (innerError?.code === 11000) {
        return res.status(409).json({ success: false, message: "Slot already booked" });
      }
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAppointmentByPatient = async (req, res) => {
  try {
    const patientId = req.body.userId;
    const appointmentId = req.params.id;
    const cancellationReason = req.body.cancellationReason || "";
    if (!validateObjectId(patientId) || !validateObjectId(appointmentId)) {
      return res.status(400).json({ success: false, message: "Invalid ids" });
    }

    const appointment = await appointmentModel.findOneAndUpdate(
      { _id: appointmentId, patient_id: patientId },
      {
        status: APPOINTMENT_STATUS.CANCELLED,
        cancelled: true,
        updated_by: "PATIENT",
        cancelled_by: "PATIENT",
        cancelled_by_actor_id: patientId,
        cancelled_at: new Date(),
        cancellation_reason: cancellationReason,
      },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { date, clinicId = null, reason = "", isGlobal = false } = req.body;
    if (!isValidDateText(date)) {
      return res.status(400).json({ success: false, message: "Invalid date, expected YYYY-MM-DD" });
    }

    const holiday = await holidayModel.create({
      date: new Date(`${date}T00:00:00.000Z`),
      clinic_id: clinicId,
      is_global: Boolean(isGlobal),
      reason,
      created_by: "ADMIN",
    });

    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmergencyBlock = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, reason = "" } = req.body;
    if (!validateObjectId(doctorId) || !isValidDateText(date)) {
      return res.status(400).json({ success: false, message: "Invalid doctor id/date" });
    }

    const emergencyBlock = await doctorBlockModel.create({
      doc_id: doctorId,
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      created_by: "ADMIN",
    });

    res.status(201).json({ success: true, data: emergencyBlock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatusByDoctor = async (req, res) => {
  try {
    const doctorId = req.body.docId;
    const appointmentId = req.params.id;
    const statusInput = String(req.body.status || "").toUpperCase();
    const statusMap = {
      COMPLETED: APPOINTMENT_STATUS.COMPLETED,
      NO_SHOW: APPOINTMENT_STATUS.NO_SHOW,
    };
    const mappedStatus = statusMap[statusInput];

    if (!validateObjectId(doctorId) || !validateObjectId(appointmentId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor/appointment id" });
    }
    if (!mappedStatus) {
      return res.status(400).json({ success: false, message: "Status must be COMPLETED or NO_SHOW" });
    }

    const appointment = await appointmentModel.findOneAndUpdate(
      { _id: appointmentId, doc_id: doctorId },
      {
        status: mappedStatus,
        isCompleted: mappedStatus === APPOINTMENT_STATUS.COMPLETED,
        cancelled: false,
        updated_by: "DOCTOR",
      },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnalyticsReport = async (_req, res) => {
  try {
    const grouped = await appointmentModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$status", APPOINTMENT_STATUS.COMPLETED] }, "$consultation_fee", 0],
            },
          },
        },
      },
    ]);

    const counters = grouped.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        acc.totalRevenue += item.revenue || 0;
        return acc;
      },
      {
        [APPOINTMENT_STATUS.BOOKED]: 0,
        [APPOINTMENT_STATUS.COMPLETED]: 0,
        [APPOINTMENT_STATUS.CANCELLED]: 0,
        [APPOINTMENT_STATUS.NO_SHOW]: 0,
        totalRevenue: 0,
      },
    );

    const totalAppointments =
      counters.booked + counters.completed + counters.cancelled + counters.no_show;

    const [uniqueDoctors, uniquePatients] = await Promise.all([
      appointmentModel.distinct("doc_id"),
      appointmentModel.distinct("patient_id"),
    ]);

    const noShowRate = totalAppointments === 0 ? 0 : (counters.no_show / totalAppointments) * 100;
    const cancellationRate =
      totalAppointments === 0 ? 0 : (counters.cancelled / totalAppointments) * 100;

    res.json({
      success: true,
      data: {
        totals: {
          appointments: totalAppointments,
          uniqueDoctors: uniqueDoctors.length,
          uniquePatients: uniquePatients.length,
        },
        statusBreakdown: {
          booked: counters.booked,
          completed: counters.completed,
          cancelled: counters.cancelled,
          noShow: counters.no_show,
        },
        rates: {
          noShowRate: Number(noShowRate.toFixed(2)),
          cancellationRate: Number(cancellationRate.toFixed(2)),
        },
        revenue: {
          completedConsultationFee: counters.totalRevenue,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNoShowAppointments = async (graceMinutes = 15) => {
  const now = new Date();
  const bookedAppointments = await appointmentModel.find({
    status: APPOINTMENT_STATUS.BOOKED,
    cancelled: { $ne: true },
  });

  const staleAppointmentIds = bookedAppointments
    .filter((appointment) => {
      const endAt = appointmentEndAtUTC(appointment);
      return now.getTime() >= endAt.getTime() + graceMinutes * 60 * 1000;
    })
    .map((appointment) => appointment._id);

  if (staleAppointmentIds.length === 0) {
    return { updated: 0 };
  }

  const result = await appointmentModel.updateMany(
    { _id: { $in: staleAppointmentIds } },
    {
      $set: {
        status: APPOINTMENT_STATUS.NO_SHOW,
        updated_by: "SYSTEM",
      },
    },
  );

  return { updated: result.modifiedCount || 0 };
};

