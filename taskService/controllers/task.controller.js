
import Task from '../models/task.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { fetchUserById } from '../api/userService.js';



// create new task
export const createTask = async (req, res) => {
    try {
        const { task_name, description, assignee } = req.body;
        const { id:assigner } = req.user

        // Validate required fields
        if (!task_name || !description || !assignee) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'All fields are required');
        }

        // Create a new task
        const newTask = new Task({
            task_name,
            description,
            assignee,
            assigner
        });

        // Save the task to the database
        await newTask.save();

        sendResponse(res, HTTP_STATUS.CREATED, true, 'Task created successfully', newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, 'Internal server error');
    }
};



// export const getTaskById = async (req, res) => {

//     try {
//         const USER_SERVICE_URL = process.env.USER_SERVICE_URL 
//         const { id } = req.params;
//         const token = req.header("Authorization"); 

//         // Find the task by ID
//         const task = await Task.findById(id);
//         if (!task) {
//             return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Task not found');
//         }

//         // Define headers with Authorization token
//         const headers = { Authorization: token };

//         // Fetch Assignee and Assigner details with JWT token in headers
//         const assigneePromise = axios.get(`${USER_SERVICE_URL}/${task.assignee}`, { headers });
//         const assignerPromise = axios.get(`${USER_SERVICE_URL}/${task.assigner}`, { headers });

//         // Resolve both API calls concurrently
//         const [assigneeResponse, assignerResponse] = await Promise.all([assigneePromise, assignerPromise]);

//         // Construct the response with user details
//         const taskWithUserDetails = {
//             ...task.toObject(),
//             assignee: assigneeResponse.data.data, // Extract user data
//             assigner: assignerResponse.data.data  // Extract user data
//         };

//         sendResponse(res, HTTP_STATUS.OK, true, 'Task retrieved successfully', taskWithUserDetails);
//     } catch (error) {
//         console.error('Error retrieving task:', error);
//         sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
//     }
// };


export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");

        // Find the task by ID
        const task = await Task.findById(id);
        if (!task) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Task not found');
        }

        // Fetch Assignee and Assigner details from User Service
        const [assignee, assigner] = await Promise.all([
            fetchUserById(task.assignee, token),
            fetchUserById(task.assigner, token)
        ]);

        // Construct the response with user details
        const taskWithUserDetails = {
            ...task.toObject(),
            assignee,
            assigner
        };

        sendResponse(res, HTTP_STATUS.OK, true, 'Task retrieved successfully', taskWithUserDetails);
    } catch (error) {
        console.error('Error retrieving task:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// update task
export const updateTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");
        const updateData = req.body;

        // Find and update the task
        const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedTask) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Task not found');
        }

        // Fetch updated Assignee and Assigner details
        const [assignee, assigner] = await Promise.all([
            fetchUserById(updatedTask.assignee, token),
            fetchUserById(updatedTask.assigner, token)
        ]);

        // Construct response with updated user details
        const updatedTaskWithUserDetails = {
            ...updatedTask.toObject(),
            assignee,
            assigner
        };

        sendResponse(res, HTTP_STATUS.OK, true, 'Task updated successfully', updatedTaskWithUserDetails);
    } catch (error) {
        console.error('Error updating task:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// delete task
export const deleteTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and update the task to set isActive to false
        const deletedTask = await Task.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!deletedTask) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Task not found');
        }

        sendResponse(res, HTTP_STATUS.OK, true, 'Task deactivated successfully', deletedTask);
    } catch (error) {
        console.error('Error deactivating task:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

// fetch task by user id
export const getTasksByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");

        // Find tasks where the user is either an assignee or assigner
        const tasks = await Task.find({
            $or: [{ assignee: id }, { assigner: id }],
            isActive: true
        });

        if (!tasks.length) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'No tasks found for this user');
        }

        // Fetch user details from User Service
        const user = await fetchUserById(id, token);

        sendResponse(res, HTTP_STATUS.OK, true, 'Tasks retrieved successfully', { user, tasks });
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};
