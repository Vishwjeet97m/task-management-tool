import User from "../models/User.model.js";
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";


// get user 
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password"); // Exclude password

        if (!user) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "User not found");
        }

        sendResponse(res, HTTP_STATUS.OK, true, "User retrieved successfully", user);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// update user
export const updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, ...updates } = req.body;

        // Check if another user exists with the same username or email
        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
            _id: { $ne: id } // Ensure it's not the same user being updated
        });
        if (existingUser) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Username or Email already in use by another user");
        }

          // Update the user and exclude the password field from the response
        const user = await User.findByIdAndUpdate(id, { username, email, ...updates }, { 
            new: true, 
            runValidators: true 
        }).select("-password");

        if (!user) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "User not found");
        }

        sendResponse(res, HTTP_STATUS.OK, true, "User updated successfully", user);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// assign role to user
export const assignRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.user;
        console.log("id--->", id);
        await User.findByIdAndUpdate(id, { role });
        sendResponse(res, HTTP_STATUS.OK, true, "Role updated successfully");
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        console.log("enter user->",query);

        if (!query) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Query parameter is required");
        }

        // Search users where username or email contains the query (case-insensitive)
        const regexQuery = new RegExp(query, "i");

        const users = await User.find({
            $or: [
                { username: { $regex: regexQuery } },
                { email: { $regex: regexQuery } }
            ]
        }).select("-password");

        console.log("users===>", users);
        sendResponse(res, HTTP_STATUS.OK, true, "Users retrieved successfully", users);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};