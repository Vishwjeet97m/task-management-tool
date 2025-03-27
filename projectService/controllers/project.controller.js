
import Project from '../models/project.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { fetchUserById } from '../api/userService.js';
import { sendUserNotification } from '../api/notificationService.js';
import { getObjectPresignedUrl, putObjectPresignedUrl } from '../config/awsConfig.js';


// Create a new project
// export const createProject = async (req, res) => {
//     try {
//       const { name, description, isActive, status, ownerId } = req.body;
//       const token = req.headers.authorization; 
  
//       // Validate required fields
//       if (!name) return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'please enter project name');
//       if (!ownerId) return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'ownerId is required');
      
//       // Create project
//       const newProject = new Project({ name, description, isActive, status, ownerId });
//       await newProject.save();

//       const ownerData = await fetchUserById(ownerId, token);
//       if (!ownerData || !ownerData.email) {
//         return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Owner email not found");
//       }
//       // Extract owner email
//       const ownerEmail = ownerData.email;

//       await sendUserNotification(
//         ownerId,
//         ownerEmail,
//         "Project Created Successfully",
//         `Your project "${name}" has been created successfully.`,
//         token
//       );
  
//       sendResponse(res, HTTP_STATUS.OK, true, "Project created successfully", newProject);
//     } catch (error) {
//       console.error("Error creating project:", error.message);
//       sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
//     }
//   };



  export const createProject = async (req, res) => {
    try {
        const { name, description, isActive, status, attachments } = req.body;
        const token = req.headers.authorization;
        const {id:ownerId} = req.user;

        // Validate required fields
        if (!name) return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Please enter project name');
        if (!ownerId) return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'OwnerId is required');

        let presignedUrls = []; // Store pre-signed URLs for frontend
        let storedAttachments = []; // Store S3 paths for MongoDB

        // Generate pre-signed upload URLs if attachments exist
        if (attachments && attachments.length > 0) {
            for (let file of attachments) {
                const { fileName, fileType } = file;
                
                // Generate pre-signed URL
                const presignedUrl = await putObjectPresignedUrl(fileName, fileType);
                
                presignedUrls.push({ fileName, presignedUrl });

                // Store only the S3 path in MongoDB
                storedAttachments.push({
                    fileName,
                    fileUrl: presignedUrl.split("?")[0]
                });
            }
        }

        // Create project with attachments
        const newProject = new Project({ 
            name, 
            description, 
            isActive, 
            status, 
            ownerId, 
            attachments: storedAttachments 
        });

        await newProject.save();

        // Fetch owner details for notification
        const ownerData = await fetchUserById(ownerId, token);
        if (!ownerData || !ownerData.email) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Owner email not found");
        }

        sendUserNotification(
            ownerId,
            ownerData.email,
            "Project Created Successfully",
            `Your project "${name}" has been created successfully.`,
            token
        );

        // Send response with project details & pre-signed URLs
        sendResponse(res, HTTP_STATUS.OK, true, "Project created successfully", {
            project: newProject,
            uploadUrls: presignedUrls // Send pre-signed URLs to frontend
        });

    } catch (error) {
        console.error("Error creating project:", error.message);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

  // fetch product by id
//   export const getProjectById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const token = req.header("Authorization");

//         // Find the project by ID
//         const project = await Project.findById(id);
//         if (!project) {
//             return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
//         }

//         // Fetch Owner details from User Service
//         const owner = await fetchUserById(project.ownerId, token);

//         // Construct the response with owner details
//         const projectWithOwnerDetails = {
//             ...project.toObject(),
//             owner
//         };

//         sendResponse(res, HTTP_STATUS.OK, true, "Project retrieved successfully", projectWithOwnerDetails);
//     } catch (error) {
//         console.error("Error retrieving project:", error);
//         sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
//     }
// };


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

        // Generate pre-signed URLs for project attachments
        let attachmentsWithPresignedUrls = [];
        if (project.attachments && project.attachments.length > 0) {
            attachmentsWithPresignedUrls = await Promise.all(
                project.attachments.map(async (attachment) => {
                    const presignedUrl = await getObjectPresignedUrl(attachment.fileUrl);
                    return {
                        fileName: attachment.fileName,
                        presignedUrl
                    };
                })
            );
        }

        // Construct the response with owner details & signed URLs
        const projectWithDetails = {
            ...project.toObject(),
            owner,
            attachments: attachmentsWithPresignedUrls
        };

        sendResponse(res, HTTP_STATUS.OK, true, "Project retrieved successfully", projectWithDetails);
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
// export const updateProjectById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const token = req.header("Authorization");
//         const updateData = req.body;

//         // Find and update the project
//         const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true });
//         if (!updatedProject) {
//             return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
//         }

//         // Fetch updated Owner details
//         const owner = await fetchUserById(updatedProject.ownerId, token);

//         // Construct response with updated owner details
//         const updatedProjectWithOwnerDetails = {
//             ...updatedProject.toObject(),
//             owner
//         };

//         sendResponse(res, HTTP_STATUS.OK, true, "Project updated successfully", updatedProjectWithOwnerDetails);
//     } catch (error) {
//         console.error("Error updating project:", error);
//         sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
//     }
// };

export const updateProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.header("Authorization");
        const updateData = req.body;
        const { attachments } = updateData;

        // Find the existing project
        const existingProject = await Project.findById(id);
        if (!existingProject) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
        }

        let presignedUrls = []; // Store pre-signed URLs for frontend
        let storedAttachments = existingProject.attachments || []; // Keep existing attachments

        if (attachments && attachments.length > 0) {
            for (let file of attachments) {
                const { fileName, fileType } = file;
                
                // Generate pre-signed URL for each new attachment
                const presignedUrl = await putObjectPresignedUrl(fileName, fileType);

                presignedUrls.push({ fileName, presignedUrl }); // Send URL to frontend

                // Store only the S3 file path in MongoDB
                storedAttachments.push({
                    fileName,
                    fileUrl: presignedUrl.split("?")[0]
                });
            }
        }

        // Update project with new data and attachments
        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { ...updateData, attachments: storedAttachments },
            { new: true }
        );

        if (!updatedProject) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "Project not found");
        }

        // Fetch updated Owner details
        const owner = await fetchUserById(updatedProject.ownerId, token);

        // Construct response with updated owner details & pre-signed URLs
        const updatedProjectWithDetails = {
            ...updatedProject.toObject(),
            owner
        };

        sendResponse(res, HTTP_STATUS.OK, true, "Project updated successfully", {
            project: updatedProjectWithDetails,
            uploadUrls: presignedUrls // Send pre-signed URLs to frontend
        });

    } catch (error) {
        console.error("Error updating project:", error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};



// get project by user id
// export const getProjectsByUserId = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const token = req.header("Authorization");

//         // Find projects where the user is the owner
//         const projects = await Project.find({ ownerId: id, isActive: true });

//         if (!projects.length) {
//             return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No projects found for this user");
//         }

//         // Fetch user details from User Service
//         const user = await fetchUserById(id, token);

//         sendResponse(res, HTTP_STATUS.OK, true, "Projects retrieved successfully", { user, projects });
//     } catch (error) {
//         console.error("Error retrieving projects:", error);
//         sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
//     }
// };

// search projects

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

        // Generate pre-signed URLs for attachments (if any)
        const projectsWithPresignedUrls = await Promise.all(projects.map(async (project) => {
            if (project.attachments && project.attachments.length > 0) {
                const updatedAttachments = await Promise.all(project.attachments.map(async (file) => ({
                    ...file.toObject(),
                    presignedUrl: await getObjectPresignedUrl(file.fileUrl) // Extract S3 key
                })));
                return { ...project.toObject(), attachments: updatedAttachments };
            }
            return project.toObject();
        }));

        sendResponse(res, HTTP_STATUS.OK, true, "Projects retrieved successfully", { user, projects: projectsWithPresignedUrls });
    } catch (error) {
        console.error("Error retrieving projects:", error);
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};

// export const searchProjects = async (req, res) => {
//     try {
//         const { query } = req.query;
//         console.log("1111");
//         if (!query) {
//             return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Query parameter is required");
//         }

//         // Search projects where name or description contains the query (case-insensitive)
//         const projects = await Project.find({
//             $or: [
//                 { name: { $regex: query, $options: "i" } }, // Case-insensitive search in name
//                 { description: { $regex: query, $options: "i" } } // Case-insensitive search in description
//             ]
//         });

//         sendResponse(res, HTTP_STATUS.OK, true, "Projects retrieved successfully", projects);
//     } catch (error) {
//         sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
//     }
// };

export const searchProjects = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Query parameter is required");
        }

        // Search projects where name or description contains the query (case-insensitive)
        const projects = await Project.find({
            $or: [
                { name: { $regex: query, $options: "i" } }, // Case-insensitive search in name
                { description: { $regex: query, $options: "i" } } // Case-insensitive search in description
            ]
        });

        let projectsWithPresignedUrls = [];
        if (projects.length) {
            // Generate pre-signed URLs for attachments
            projectsWithPresignedUrls = await Promise.all(projects.map(async (project) => {
                if (project.attachments && project.attachments.length > 0) {
                    const updatedAttachments = await Promise.all(project.attachments.map(async (file) => ({
                        ...file.toObject(),
                        presignedUrl: await getObjectPresignedUrl(file.fileUrl) // Extract S3 key
                    })));
                    return { ...project.toObject(), attachments: updatedAttachments };
                }
                return project.toObject();
            }));
        }

        sendResponse(res, HTTP_STATUS.OK, true, "Projects retrieved successfully", projectsWithPresignedUrls);
    } catch (error) {
        sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
    }
};