import express from 'express';
import { createProject, getProjectById, updateProjectById, deleteProjectById, getProjectsByUserId, searchProjects} from '../controllers/project.controller.js';

const router = express.Router();


router.get('/search', searchProjects);
router.post('', createProject);
router.get('/:id', getProjectById);
router.patch('/:id', updateProjectById);
router.delete('/:id', deleteProjectById);
router.get('/user/:id', getProjectsByUserId);

export default router;
