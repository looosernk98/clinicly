import express from "express";
import authDoctor from "../middlewares/authDoctor.middleware.js";
import authUser from "../middlewares/auth.middleware.js";
import authAdmin from "../middlewares/authAdmin.middleware.js";
import {
  createAvailabilityRule,
  updateAvailabilityRule,
  deleteAvailabilityRule,
  createDoctorLeave,
  createDoctorBlock,
  getDoctorSlots,
  createAppointment,
  rescheduleAppointment,
  cancelAppointmentByPatient,
  createHoliday,
  createEmergencyBlock,
  updateAppointmentStatusByDoctor,
  getAnalyticsReport,
} from "../controllers/scheduling.controller.js";

const schedulingRouter = express.Router();

// Doctor APIs
schedulingRouter.post("/availability-rules", authDoctor, createAvailabilityRule);
schedulingRouter.put("/availability-rules/:id", authDoctor, updateAvailabilityRule);
schedulingRouter.delete("/availability-rules/:id", authDoctor, deleteAvailabilityRule);
schedulingRouter.post("/doctor-leaves", authDoctor, createDoctorLeave);
schedulingRouter.post("/doctor-blocks", authDoctor, createDoctorBlock);
schedulingRouter.patch("/appointments/:id/status", authDoctor, updateAppointmentStatusByDoctor);

// Patient APIs
schedulingRouter.get("/doctors/:id/slots", getDoctorSlots);
schedulingRouter.post("/appointments", authUser, createAppointment);
schedulingRouter.put("/appointments/:id/reschedule", authUser, rescheduleAppointment);
schedulingRouter.delete("/appointments/:id", authUser, cancelAppointmentByPatient);

// Admin APIs
schedulingRouter.post("/holidays", authAdmin, createHoliday);
schedulingRouter.post("/emergency-blocks", authAdmin, createEmergencyBlock);
schedulingRouter.get("/reports/analytics", authAdmin, getAnalyticsReport);

export default schedulingRouter;
