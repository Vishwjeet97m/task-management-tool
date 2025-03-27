import express from 'express';
import { sendNotification, getUserNotifications } from '../controllers/notification.controller.js';

const router = express.Router();

router.post("/send", sendNotification);
router.get("/:userId", getUserNotifications);

export default router;
