import { Router } from "express";
import {
  bootstrapController,
  cancelAppointmentController,
  completeAppointmentController,
  createAppointmentController,
  createBarberController,
  createClientController,
  createServiceController,
  deleteAppointmentController,
  financialSummaryController,
  healthController,
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
router.get("/availability/booking", asyncHandler(listBookableAvailabilityController));
router.get("/availability/booking/month", asyncHandler(listBookableAvailabilityMonthController));
router.patch("/availability", asyncHandler(updateAvailabilityController));

router.get("/financial-summary", asyncHandler(financialSummaryController));

router.post("/services", asyncHandler(createServiceController));
router.patch("/services/:serviceId", asyncHandler(updateServiceController));

router.post("/clients", asyncHandler(createClientController));
router.post("/barbers", asyncHandler(createBarberController));
