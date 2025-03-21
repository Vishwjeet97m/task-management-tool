import express from 'express';
import { createTask, getTaskById, updateTaskById, deleteTaskById, getTasksByUserId, getTasks} from '../controllers/task.controller.js';

const router = express.Router();


router.post('', createTask);
router.get('', getTasks);
router.get('/:id', getTaskById);
router.patch('/:id', updateTaskById);
router.delete('/:id', deleteTaskById);
router.get('/user/:id', getTasksByUserId);

export default router;
