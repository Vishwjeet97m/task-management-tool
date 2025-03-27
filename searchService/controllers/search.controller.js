import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import {  searchUsers } from "../api/userService.js";
import {  searchTasks } from "../api/taskService.js";
import {  searchProjects } from "../api/projectService.js";


export const search = async (req, res) => {
    try {
        const { query, type } = req.query;
        const token = req.headers.authorization
        console.log("enter-->", query, type, token )

        if (!query) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Search query is required");
        }

        let searchResults = {};

        // Fetch search results based on `type`
        if (type === "task") {
            searchResults.tasks = await searchTasks(query, token);
        } else if (type === "project") {
            searchResults.projects = await searchProjects(query, token);
        } else if (type === "user") {
            searchResults.users = await searchUsers(query, token);
        } else {
            console.log("enter2-->", )
            // Search across all microservices
            const [tasks, projects, users] = await Promise.all([
                searchTasks(query, token),
                searchProjects(query, token),
                searchUsers(query, token),
            ]);
            console.log("enter3-->", "tasksssssssssssssssss---->",tasks,"projects---------->", projects,"users------------>", users );

            // Assign only properties that have data
            if (tasks.length) searchResults.tasks = tasks;
            if (projects.length) searchResults.projects = projects;
            if (users.length) searchResults.users = users;
        }

        sendResponse(res, HTTP_STATUS.OK, true, "Search results fetched successfully", searchResults);
    } catch (error) {
        console.error("Error in search service:", error.message);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

