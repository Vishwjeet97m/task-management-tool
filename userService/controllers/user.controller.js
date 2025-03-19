import User from "../models/User.model.js";
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";


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
        sendResponse(res, HTTP_STATUS.CREATED, true, "User registered successfully", user);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return sendResponse(res,  HTTP_STATUS.BAD_REQUEST, false, "Invalid credentials");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendResponse(res,  HTTP_STATUS.BAD_REQUEST, false, "Invalid credentials");

        const token = jwt.sign({ id: user._id, role: user.role }, 'your_secret_key', { expiresIn: '1h' });
        sendResponse(res, HTTP_STATUS.OK, true, "Login successful", { token, role: user.role });
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// get user 
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password"); // Exclude password

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
        const { userId } = req.params;
        const updates = req.body; 

        const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select("-password");

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
        const { userId, role } = req.body;
        await User.findByIdAndUpdate(userId, { role });
        sendResponse(res, HTTP_STATUS.OK, true, "Role updated successfully");
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};
