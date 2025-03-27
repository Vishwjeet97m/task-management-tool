
import Task from '../models/task.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { fetchUserById } from '../api/userService.js';
import { fetchProjectById } from '../api/projectService.js';
import {sendUserNotification} from '../api/notificationService.js'
import { getObjectPresignedUrl, putObjectPresignedUrl } from '../config/awsConfig.js';



// create new task
export const createTask = async (req, res) => {
    try {
        const { task_name, description, assignee, project, attachments } = req.body;
        const { id:assigner } = req.user
        const token = req.headers.authorization; // Get auth token

        // Validate required fields
        if (!task_name || !description || !assignee || !project) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'some fields are missing');
        }

        let presignedUrls = []; // Store pre-signed URLs for frontend
        let storedAttachments = []; // Store S3 paths for MongoDB

        if (attachments && attachments.length > 0) {
            for (let file of attachments) {
                const { fileName, fileType } = file;
                
                // Generate pre-signed URL for each attachment
                const presignedUrl = await putObjectPresignedUrl(fileName,fileType);
                
                presignedUrls.push({ fileName, presignedUrl }); // Return URL to frontend

                // Store only the S3 path (excluding query params) in MongoDB
                storedAttachments.push({
                    fileName,
                    fileUrl: presignedUrl.split("?")[0]
                });
            }
        }

        // Create a new task
        const newTask = new Task({
            task_name,
            description,
            assignee,
            assigner,
            project,
            attachments: storedAttachments
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
           sendUserNotification(
            assignee,
            assigneeEmail,
            "New Task Assigned",
            `A new task "${task_name}" has been assigned to you.`,
            token
        );


       
        // Send response with task details & pre-signed URLs
        sendResponse(res, HTTP_STATUS.CREATED, true, "Task created successfully", {
            task: newTask,
            uploadUrls: presignedUrls // Send pre-signed URLs to frontend
        });

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

        // Generate pre-signed URLs for attachments
        let attachmentsWithPresignedUrls = [];
        if (task.attachments && task.attachments.length > 0) {
            attachmentsWithPresignedUrls = await Promise.all(
                task.attachments.map(async (attachment) => {
                    const presignedUrl = await getObjectPresignedUrl(attachment.fileUrl);
                    return {
                        fileName: attachment.fileName,
                        presignedUrl
                    };
                })
            );
        }

        // Construct the response with user and project details
        const taskWithDetails = {
            ...task.toObject(),
            assignee,
            assigner,
            project,
            attachments: attachmentsWithPresignedUrls
        };

        sendResponse(res, HTTP_STATUS.OK, true, 'Task retrieved successfully', taskWithDetails);
    } catch (error) {
        console.error('Error retrieving task:', error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

export const updateTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");
        const updateData = req.body;
        const { attachments } = updateData;

        // Find the existing task
        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Task not found");
        }

        let presignedUrls = []; // Store pre-signed URLs for frontend
        let storedAttachments = existingTask.attachments || []; // Keep existing attachments

        if (attachments && attachments.length > 0) {
            for (let file of attachments) {
                const { fileName, fileType } = file;
                
                // Generate pre-signed URL for each new attachment
                const presignedUrl = await putObjectPresignedUrl(fileName,fileType);

                presignedUrls.push({ fileName, presignedUrl }); // Send URL to frontend

                // Store only the S3 file path in MongoDB
                storedAttachments.push({
                    fileName,
                    fileUrl: presignedUrl.split("?")[0]
                });
            }
        }

        // Update task with new data and attachments
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { ...updateData, attachments: storedAttachments },
            { new: true }
        );

        if (!updatedTask) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Task not found");
        }

        // Fetch updated Assignee, Assigner, and Project details
        const [assignee, assigner, project] = await Promise.all([
            fetchUserById(updatedTask.assignee, token),
            fetchUserById(updatedTask.assigner, token),
            fetchProjectById(updatedTask.project, token),
        ]);

        // Construct response with updated user, project details, and pre-signed URLs
        const updatedTaskWithDetails = {
            ...updatedTask.toObject(),
            assignee,
            assigner,
            project
        };

        sendResponse(res, HTTP_STATUS.OK, true, "Task updated successfully", {
            task: updatedTaskWithDetails,
            uploadUrls: presignedUrls // Send pre-signed URLs to frontend
        });

    } catch (error) {
        console.error("Error updating task:", error);
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

        // Generate presigned URLs for attachments
        const tasksWithPresignedUrls = await Promise.all(tasks.map(async (task) => {
            if (task.attachments && task.attachments.length > 0) {
                const updatedAttachments = await Promise.all(task.attachments.map(async (file) => ({
                    ...file.toObject(),
                    presignedUrl: await getObjectPresignedUrl(file.fileUrl) // Extract S3 key
                })));
                return { ...task.toObject(), attachments: updatedAttachments };
            }
            return task.toObject();
        }));

        sendResponse(res, HTTP_STATUS.OK, true, 'Tasks retrieved successfully', { user, tasks: tasksWithPresignedUrls });
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
        let tasksWithPresignedUrls = []
        if (tasks.length) {
             // Generate presigned URLs for attachments
            tasksWithPresignedUrls = await Promise.all(tasks.map(async (task) => {
            if (task.attachments && task.attachments.length > 0) {
                const updatedAttachments = await Promise.all(task.attachments.map(async (file) => ({
                    ...file.toObject(),
                    presignedUrl: await getObjectPresignedUrl(file.fileUrl.split("amazonaws.com/")[1]) // Extract S3 key
                })));
                return { ...task.toObject(), attachments: updatedAttachments };
            }
            return task.toObject();
        }));
        }

        // const finalData = tasks.length?tasksWithPresignedUrls:tasks
        sendResponse(res, HTTP_STATUS.OK, true, 'Tasks retrieved successfully', tasksWithPresignedUrls );
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
                { task_name: { $regex: query, $options: "i" } }, // Case-insensitive search in title
                { description: { $regex: query, $options: "i" } } // Case-insensitive search in description
            ]
        });
        console.log("taskssss->", tasks);
        let tasksWithPresignedUrls = []
        if (tasks.length) {
            // Generate presigned URLs for attachments
            tasksWithPresignedUrls = await Promise.all(tasks.map(async (task) => {
            if (task.attachments && task.attachments.length > 0) {
                const updatedAttachments = await Promise.all(task.attachments.map(async (file) => ({
                    ...file.toObject(),
                    presignedUrl: await getObjectPresignedUrl(file.fileUrl) // Extract S3 key
                })));
                return { ...task.toObject(), attachments: updatedAttachments };
            }
            return task.toObject();
        }));
        }

        // let finalData = tasks.length?tasksWithPresignedUrls:tasks
        
       console.log("tasksWithPresignedUrls----->",tasksWithPresignedUrls);
        sendResponse(res, HTTP_STATUS.OK, true, "Tasks retrieved successfully", tasksWithPresignedUrls);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


