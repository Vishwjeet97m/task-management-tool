import express from 'express';
import {addCommentToProject, addCommentToTask, getCommentsByProject, getCommentsByTask } from '../controllers/comment.controller.js';

const router = express.Router();

router.post("/task/:taskId", addCommentToTask);
router.get("/task/:taskId",getCommentsByTask);
router.post("/project/:projectId", addCommentToProject);
router.get("/project/:projectId",getCommentsByProject);

export default router;
