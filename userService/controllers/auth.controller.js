import {sendUserNotification} from '../api/notificationService.js'
import User from "../models/User.model.js";
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { generateTokens } from "../utils/token.js";
import bcrypt from 'bcrypt';


//regiser user
export const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Username or Email already exists");
        }
        // crete new user
        const user = new User({ username, email, password, role });
        await user.save();

        // Call Notification Service to send a welcome email
        const subject = "Welcome to Our Platform!";
        const message = `Hello ${username}, welcome to our platform. We're glad to have you!`;

        try {
            await sendUserNotification(user._id, user.email, subject, message);
        } catch (notifyError) {
            console.error("Error sending notification:", notifyError.message);
        }
        sendResponse(res, HTTP_STATUS.CREATED, true, "User registered successfully", user);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// login user
export const login = async (req, res) => {
    try {
        const secretKey = process.env.JWT_SECRET
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return sendResponse(res,  HTTP_STATUS.BAD_REQUEST, false, "Invalid credentials");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendResponse(res,  HTTP_STATUS.BAD_REQUEST, false, "Invalid credentials");

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(user._id, user.role);
        
        // Convert Mongoose object to plain object and remove password
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        sendResponse(res, HTTP_STATUS.OK, true, "Login successful", { 
            user: userWithoutPassword ,
            accessToken, 
            refreshToken
        });
        } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};