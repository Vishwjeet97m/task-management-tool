import express from 'express';
import 'dotenv/config';
import connectDB from './config/db.js';
import taskRoutes from './routes/task.routes.js'
import cors from 'cors';
import { verifyToken } from './middlewares/authMiddleware.js';


const app = express();
const port = process.env.PORT || 5002;

// Connect to MongoDB
connectDB();


app.use(cors()); 
app.use(express.json()); // Middleware to parse JSON



// User-related routes → `/api/user/`
app.use("/api/task",verifyToken, taskRoutes);


app.listen(port,()=>{
  console.log(`user service is running on port ${port}`);
})