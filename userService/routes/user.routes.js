import express from 'express';
import { register, login, assignRole, getUserById, updateUserById } from '../controllers/user.controller.js';

const router = express.Router();


router.get('/user/:id', getUserById);
router.patch('/user/:id', updateUserById);
router.patch('/assign-role', assignRole);

export default router;
