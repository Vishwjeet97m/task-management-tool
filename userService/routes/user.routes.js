import express from 'express';
import {assignRole, getUserById, updateUserById } from '../controllers/user.controller.js';

const router = express.Router();


router.get('/:id', getUserById);
router.patch('/:id', updateUserById);
router.patch('/assign_role', assignRole);

export default router;
