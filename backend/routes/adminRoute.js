import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, bulkAddDoctors, updateDoctorImages } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.post("/bulk-add-doctors", authAdmin, bulkAddDoctors)
adminRouter.post("/update-doctor-images", authAdmin, updateDoctorImages)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

export default adminRouter;