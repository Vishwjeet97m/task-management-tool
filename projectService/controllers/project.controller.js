
import Project from '../models/project.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { fetchUserById } from '../api/userService.js';
import { sendUserNotification } from '../api/notificationService.js';


// Create a new project
export const createProject = async (req, res) => {
    try {
      const { name, description, isActive, status, ownerId } = req.body;
      const token = req.headers.authorization; 
  
      // Validate required fields
      if (!name) return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'please enter project name');
      if (!ownerId) return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'ownerId is required');
      
      // Create project
      const newProject = new Project({ name, description, isActive, status, ownerId });
      await newProject.save();

      const ownerData = await fetchUserById(ownerId, token);
      if (!ownerData || !ownerData.email) {
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Owner email not found");
      }
      // Extract owner email
      const ownerEmail = ownerData.email;

      await sendUserNotification(
        ownerId,
        ownerEmail,
        "Project Created Successfully",
        `Your project "${name}" has been created successfully.`,
        token
      );
  
      sendResponse(res, HTTP_STATUS.OK, true, "Project created successfully", newProject);
    } catch (error) {
      console.error("Error creating project:", error.message);
      sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
  };

  // fetch product by id
  export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");

        // Find the project by ID
        const project = await Project.findById(id);
        if (!project) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
        }

        // Fetch Owner details from User Service
        const owner = await fetchUserById(project.ownerId, token);

        // Construct the response with owner details
        const projectWithOwnerDetails = {
            ...project.toObject(),
            owner
        };

        sendResponse(res, HTTP_STATUS.OK, true, "Project retrieved successfully", projectWithOwnerDetails);
    } catch (error) {
        console.error("Error retrieving project:", error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

// delete project
export const deleteProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and update the project to set isActive to false
        const deletedProject = await Project.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!deletedProject) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
        }

        sendResponse(res, HTTP_STATUS.OK, true, "Project deleted successfully", deletedProject);
    } catch (error) {
        console.error("Error deactivating project:", error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};


// update project by id
export const updateProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");
        const updateData = req.body;

        // Find and update the project
        const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedProject) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
        }

        // Fetch updated Owner details
        const owner = await fetchUserById(updatedProject.ownerId, token);

        // Construct response with updated owner details
        const updatedProjectWithOwnerDetails = {
            ...updatedProject.toObject(),
            owner
        };

        sendResponse(res, HTTP_STATUS.OK, true, "Project updated successfully", updatedProjectWithOwnerDetails);
    } catch (error) {
        console.error("Error updating project:", error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};



// get project by user id
export const getProjectsByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");

        // Find projects where the user is the owner
        const projects = await Project.find({ ownerId: id, isActive: true });

        if (!projects.length) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No projects found for this user");
        }

        // Fetch user details from User Service
        const user = await fetchUserById(id, token);

        sendResponse(res, HTTP_STATUS.OK, true, "Projects retrieved successfully", { user, projects });
    } catch (error) {
        console.error("Error retrieving projects:", error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

