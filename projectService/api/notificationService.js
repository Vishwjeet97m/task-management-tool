import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

export const sendUserNotification = async (userId, email, subject, message, token=null) => {
    try {
        if (!userId || !email || !subject || !message) {
            throw new Error("Missing required parameters");
        }

        const headers = { Authorization: token }; // Pass token if needed

        // Call Notification Service API
        const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/send`, 
        { userId, email, subject, message }, { headers });

        return response.data; // Return response from Notification Service
    } catch (error) {
        console.error("Error sending notification from User Service:", error.message);
        throw new Error("Failed to send notification via Notification Service");
    }
};
