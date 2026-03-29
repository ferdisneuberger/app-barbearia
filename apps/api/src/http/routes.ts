import { Router } from "express";
import {
  bootstrapController,
  cancelAppointmentController,
  completeAppointmentController,
  createAdminController,
  createAppointmentController,
  createBarberController,
  createClientController,
  deleteAdminController,
  deleteBarberController,
  deleteClientController,
  deleteServiceController,
  createServiceController,
  deleteAppointmentController,
  financialSummaryController,
  healthController,
  listAvailabilityMonthController,
  listBookableAvailabilityController,
  listBookableAvailabilityMonthController,
  listAppointmentsController,
  listAvailabilityController,
  loginController,
  meController,
  payAppointmentController,
  registerController,
  updateAppointmentController,
  updateAvailabilityController,
  updateBusinessRulesController,
  updateServiceController
} from "./controllers.ts";
import { asyncHandler } from "./utils.ts";

export const router = Router();

router.get("/health", healthController);

router.post("/auth/login", asyncHandler(loginController));
router.post("/auth/register", asyncHandler(registerController));
router.get("/auth/me", asyncHandler(meController));

router.get("/bootstrap", asyncHandler(bootstrapController));
router.get("/appointments", asyncHandler(listAppointmentsController));
router.post("/appointments", asyncHandler(createAppointmentController));
router.patch("/appointments/:appointmentId/cancel", asyncHandler(cancelAppointmentController));
router.patch("/appointments/:appointmentId/complete", asyncHandler(completeAppointmentController));
router.patch("/appointments/:appointmentId/pay", asyncHandler(payAppointmentController));
router.patch("/appointments/:appointmentId", asyncHandler(updateAppointmentController));
router.delete("/appointments/:appointmentId", asyncHandler(deleteAppointmentController));

router.get("/availability", asyncHandler(listAvailabilityController));
router.get("/availability/month", asyncHandler(listAvailabilityMonthController));
router.get("/availability/booking", asyncHandler(listBookableAvailabilityController));
router.get("/availability/booking/month", asyncHandler(listBookableAvailabilityMonthController));
router.patch("/availability", asyncHandler(updateAvailabilityController));

router.get("/financial-summary", asyncHandler(financialSummaryController));
router.patch("/business-rules", asyncHandler(updateBusinessRulesController));

router.post("/services", asyncHandler(createServiceController));
router.patch("/services/:serviceId", asyncHandler(updateServiceController));
router.delete("/services/:serviceId", asyncHandler(deleteServiceController));

router.post("/clients", asyncHandler(createClientController));
router.delete("/clients/:clientId", asyncHandler(deleteClientController));
router.post("/barbers", asyncHandler(createBarberController));
router.delete("/barbers/:barberId", asyncHandler(deleteBarberController));
router.post("/admins", asyncHandler(createAdminController));
router.delete("/admins/:adminId", asyncHandler(deleteAdminController));
