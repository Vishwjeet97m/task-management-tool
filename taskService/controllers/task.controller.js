
import Task from '../models/task.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { fetchUserById } from '../api/userService.js';
import { fetchProjectById } from '../api/projectService.js';
import {sendUserNotification} from '../api/notificationService.js'



// create new task
export const createTask = async (req, res) => {
    try {
        const { task_name, description, assignee, project } = req.body;
        const { id:assigner } = req.user
        const token = req.headers.authorization; // Get auth token

        // Validate required fields
        if (!task_name || !description || !assignee || !project) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'some fields are missing');
        }

        // Create a new task
        const newTask = new Task({
            task_name,
            description,
            assignee,
            assigner,
            project
        });

        // Save the task to the database
        await newTask.save();

        // Fetch assignee details from User Service
        const assigneeData = await fetchUserById(assignee, token);
        if (!assigneeData || !assigneeData.email) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Assignee email not found");
        }

        // Extract assignee email
        const assigneeEmail = assigneeData.email;

         // Send Notification to the Assignee
         await sendUserNotification(
            assignee,
            assigneeEmail,
            "New Task Assigned",
            `A new task "${task_name}" has been assigned to you.`,
            token
        );


        sendResponse(res, HTTP_STATUS.CREATED, true, 'Task created successfully', newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");

        // Find the task by ID
        const task = await Task.findById(id);
        if (!task) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Task not found');
        }

        // Fetch Assignee, Assigner, and Project details from respective services
        const [assignee, assigner, project] = await Promise.all([
            fetchUserById(task.assignee, token),
            fetchUserById(task.assigner, token),
            fetchProjectById(task.project, token),
        ]);

        // Construct the response with user and project details
        const taskWithDetails = {
            ...task.toObject(),
            assignee,
            assigner,
            project
        };

        sendResponse(res, HTTP_STATUS.OK, true, 'Task retrieved successfully', taskWithDetails);
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

        // Fetch updated Assignee, Assigner, and Project details
        const [assignee, assigner, project] = await Promise.all([
            fetchUserById(updatedTask.assignee, token),
            fetchUserById(updatedTask.assigner, token),
            fetchProjectById(updatedTask.project, token),
        ]);

        // Construct response with updated user and project details
        const updatedTaskWithDetails = {
            ...updatedTask.toObject(),
            assignee,
            assigner,
            project
        };

        sendResponse(res, HTTP_STATUS.OK, true, 'Task updated successfully', updatedTaskWithDetails);
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

// fetch tasks
export const getTasks = async (req, res) => {
    try {
        const query = Object.keys(req.query).length ? req.query : {};  // Retrieve query parameters

        // Find tasks based on query filters
        const tasks = await Task.find(query);
        if (!tasks.length) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'No tasks found');
        }

        sendResponse(res, HTTP_STATUS.OK, true, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


export const searchTasks = async (req, res) => {
    try {
        const { query } = req.query;
        console.log("query in search task controller",query);

        if (!query) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Query parameter is required");
        }

        // Search tasks where title or description contains the query (case-insensitive)

        const tasks = await Task.find({
            $or: [
                { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
                { description: { $regex: query, $options: "i" } } // Case-insensitive search in description
            ]
        });
        console.log("taskssss->", tasks);

        sendResponse(res, HTTP_STATUS.OK, true, "Tasks retrieved successfully", tasks);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

