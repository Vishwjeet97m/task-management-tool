import express from 'express';
import {assignRole, getUserById, searchUsers, updateUserById } from '../controllers/user.controller.js';

const router = express.Router();


router.get('/search', searchUsers);
router.patch('/assign_role', assignRole);
router.get('/:id', getUserById);
router.patch('/:id', updateUserById);

export default router;
