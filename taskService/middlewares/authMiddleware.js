import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/commonUtils.js"; // Import sendResponse
import { HTTP_STATUS } from "../utils/httpStatus.js"; // Import HTTP status constants

export const verifyToken = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        if (!token) {
            return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, false, "Access Denied! No token provided.");
        }
        const tokenValue = token.split(" ")[1];
        const decoded = jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET);
        console.log("decoded==>",decoded);
        req.user = decoded;

        next(); 
    } catch (error) {
        return sendResponse(res, HTTP_STATUS.FORBIDDEN, false, "Invalid or Expired Token");
    }
};
