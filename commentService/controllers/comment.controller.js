
import Comment from '../models/comment.model.js';
import { sendResponse } from "../utils/commonUtils.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import { fetchUserById } from '../api/userService.js';
// import { fetchProjectById } from '../api/projectService.js';
import { getObjectPresignedUrl, putObjectPresignedUrl } from '../config/awsConfig.js';


// Add Comment to a Task
// export const addCommentToTask = async (req, res) => {
//   try {
//     const { text } = req.body;
//     const { taskId } = req.params;
//     const { id:author } = req.user;


//     if (!text) {
//       return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Text required.")
//     }

//     const comment = new Comment({ text, author, task: taskId });
//     await comment.save();

//     sendResponse(res, HTTP_STATUS.CREATED, true, "Comment added to task.", comment );
//   } catch (error) {
//     console.log("Error adding comment to task", error.message);
//     sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message)
//   }
// };

export const addCommentToTask = async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const { taskId } = req.params;
    const { id: author } = req.user;

    if (!text) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Text is required.");
    }

    let presignedUrls = []; // For frontend
    let storedAttachments = []; // To save in DB

    if (attachments && attachments.length > 0) {
      for (let file of attachments) {
        const { fileName, fileType } = file;

        // Generate pre-signed URL for each attachment
        const presignedUrl = await putObjectPresignedUrl(fileName, fileType);

        presignedUrls.push({ fileName, presignedUrl });

        // Store only the S3 path (excluding query params) in MongoDB
        storedAttachments.push({
          fileName,
          fileUrl: presignedUrl.split("?")[0]
        });
      }
    }

    // Create and save comment
    const comment = new Comment({
      text,
      author,
      task: taskId,
      attachments: storedAttachments
    });

    await comment.save();

    sendResponse(res, HTTP_STATUS.CREATED, true, "Comment added successfully", {
      comment,
      uploadUrls: presignedUrls // Send pre-signed URLs to frontend
    });

  } catch (error) {
    console.error("Error adding comment to task:", error);
    sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
  }
};

// Add Comment to a Project
// export const addCommentToProject = async (req, res) => {
//     try {
//       const { text } = req.body;
//       const { projectId } = req.params;
//       const { id:author } = req.user;
  
//       if (!text ) {
//           sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Text is required.")
//       }
  
//       const comment = new Comment({ text, author, project: projectId });
//       await comment.save();
  
//       sendResponse(res, HTTP_STATUS.CREATED, true, "Comment added to project.", comment );
//     } catch (error) {
//       console.log("Error adding comment to project", error.message);
//       sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message)
//     }
//   };


export const addCommentToProject = async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const { projectId } = req.params;
    const { id: author } = req.user;

    if (!text) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Text is required.");
    }

    let presignedUrls = []; // For frontend
    let storedAttachments = []; // To save in DB

    if (attachments && attachments.length > 0) {
      for (let file of attachments) {
        const { fileName, fileType } = file;

        // Generate pre-signed URL for each attachment
        const presignedUrl = await putObjectPresignedUrl(fileName, fileType);

        presignedUrls.push({ fileName, presignedUrl });

        // Store only the S3 path (excluding query params) in MongoDB
        storedAttachments.push({
          fileName,
          fileUrl: presignedUrl.split("?")[0]
        });
      }
    }

    // Create and save comment
    const comment = new Comment({
      text,
      author,
      project: projectId,
      attachments: storedAttachments
    });

    await comment.save();

    sendResponse(res, HTTP_STATUS.CREATED, true, "Comment added to project.", {
      comment,
      uploadUrls: presignedUrls // Send pre-signed URLs to frontend
    });

  } catch (error) {
    console.error("Error adding comment to project:", error);
    sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
  }
};
  

// Get Comments by Task ID
// export const getCommentsByTask = async (req, res) => {
//     try {
//       const { taskId } = req.params;
//       const token = req.headers.authorization;
  
//       const comments = await Comment.find({ task: taskId });
//       console.log("comments project--->", comments)
  
//       const commentsWithUser = await Promise.all(
//         comments.map(async (comment) => {
//           try {
//             const user = await fetchUserById(comment.author, token);
//             return {
//               _id: comment._id,
//               text: comment.text,
//               author: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//               },
//               task: comment.task,
//               createdAt: comment.createdAt,
//               updatedAt: comment.updatedAt,
//             };
//           } catch (error) {
//             console.error(`Error fetching user for comment:`, error.message);
//           }
//         })
//       );

//       sendResponse(res, 200, true, "Comments fetched successfully", commentsWithUser);
//     } catch (error) {
//       sendResponse(res, 500, false, "Server error", error);
//     }
//   };

export const getCommentsByTask = async (req, res) => {
  try {
      const { taskId } = req.params;
      const token = req.headers.authorization;

      const comments = await Comment.find({ task: taskId });
      console.log("comments task--->", comments);

      const commentsWithUserAndUrls = await Promise.all(
          comments.map(async (comment) => {
              try {
                  const user = await fetchUserById(comment.author, token);

                  // Generate presigned URLs for attachments
                  let updatedAttachments = [];
                  if (comment.attachments && comment.attachments.length > 0) {
                      updatedAttachments = await Promise.all(
                          comment.attachments.map(async (file) => ({
                              ...file.toObject(),
                              presignedUrl: await getObjectPresignedUrl(file.fileUrl),
                          }))
                      );
                  }

                  return {
                      _id: comment._id,
                      text: comment.text,
                      author: {
                          _id: user._id,
                          name: user.name,
                          email: user.email,
                      },
                      task: comment.task,
                      attachments: updatedAttachments, // Updated attachments with URLs
                      createdAt: comment.createdAt,
                      updatedAt: comment.updatedAt,
                  };
              } catch (error) {
                  console.error(`Error fetching user for comment:`, error.message);
              }
          })
      );

      sendResponse(res, 200, true, "Comments fetched successfully", commentsWithUserAndUrls);
  } catch (error) {
      sendResponse(res, 500, false, "Server error", error);
  }
};

// Get Comments by Project ID
// export const getCommentsByProject = async (req, res) => {
//     try {
//       const { projectId } = req.params;
//       const token = req.headers.authorization;
  
//       const comments = await Comment.find({ project: projectId });
//       console.log("comments project--->", comments)
  
//       const commentsWithUser = await Promise.all(
//         comments.map(async (comment) => {
//           try {
//             const user = await fetchUserById(comment.author, token);
//             return {
//               _id: comment._id,
//               text: comment.text,
//               author: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//               },
//               project: comment.project,
//               createdAt: comment.createdAt,
//               updatedAt: comment.updatedAt,
//             };
//           } catch (error) {
//             console.log(`Error fetching user for comment:`, error.message);
//           }
//         })
//       );
  
//       sendResponse(res, 200, true, "Comments fetched successfully", commentsWithUser);
//     } catch (error) {
//       sendResponse(res, 500, false, "Server error", error);
//     }
//   };

export const getCommentsByProject = async (req, res) => {
  try {
      const { projectId } = req.params;
      const token = req.headers.authorization;

      const comments = await Comment.find({ project: projectId });
      console.log("comments project--->", comments);

      const commentsWithUserAndUrls = await Promise.all(
          comments.map(async (comment) => {
              try {
                  const user = await fetchUserById(comment.author, token);

                  // Generate presigned URLs for attachments
                  let updatedAttachments = [];
                  if (comment.attachments && comment.attachments.length > 0) {
                      updatedAttachments = await Promise.all(
                          comment.attachments.map(async (file) => ({
                              ...file.toObject(),
                              presignedUrl: await getObjectPresignedUrl(file.fileUrl),
                          }))
                      );
                  }

                  return {
                      _id: comment._id,
                      text: comment.text,
                      author: {
                          _id: user._id,
                          name: user.name,
                          email: user.email,
                      },
                      project: comment.project,
                      attachments: updatedAttachments, // Updated attachments with URLs
                      createdAt: comment.createdAt,
                      updatedAt: comment.updatedAt,
                  };
              } catch (error) {
                  console.log(`Error fetching user for comment:`, error.message);
              }
          })
      );

      sendResponse(res, 200, true, "Comments fetched successfully", commentsWithUserAndUrls);
  } catch (error) {
      sendResponse(res, 500, false, "Server error", error);
  }
};
