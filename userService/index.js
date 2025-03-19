import express from 'express';
import 'dotenv/config';
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import cors from 'cors';
import { verifyToken } from './middlewares/authMiddleware.js';


const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();


app.use(cors()); 
app.use(express.json()); // Middleware to parse JSON


// Authentication routes (Register & Login) → `/api/auth/`
app.use("/api/auth", authRoutes);
// User-related routes → `/api/user/`
app.use("/api/user",verifyToken, userRoutes);







app.listen(port,()=>{
  console.log(`user service is running on port ${port}`);
})