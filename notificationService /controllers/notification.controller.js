import { fetchUserById } from '../api/userService.js';
import { sendEmailNotification } from '../config/notification.js';
import Notification from '../models/notification.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";

export const sendNotification = async (req, res) => {
    try {
        const { userId, message, subject, email, } = req.body;

        // Store notification in DB
        const notification = new Notification({ userId, message});
        await notification.save();

        // Send Email Notification
        await sendEmailNotification(email, subject, message);

        sendResponse(res, HTTP_STATUS.CREATED, true, "Notification sent successfully", notification);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, "Error sending notification", error);
    }
};

export const getUserNotifications = async (req, res) => {
  try {
      const { userId } = req.params;
      const token = req.headers.authorization; // Extract token from request headers

      // Fetch user details from User Microservice
      const user = await fetchUserById(userId, token);

      if (!user) {
          return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "User not found");
      }

      // Fetch notifications for the user
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

      sendResponse(res, HTTP_STATUS.OK, true, "Notifications fetched successfully", {
          user,
          notifications
      });
  } catch (error) {
      sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, "Error fetching notifications", error.message);
  }
};