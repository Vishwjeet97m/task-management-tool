import express from 'express';
import 'dotenv/config';
import connectDB from './config/db.js';
import commentRoutes from './routes/comment.routes.js'
import cors from 'cors';
import { verifyToken } from './middlewares/authMiddleware.js';


const app = express();
const port = process.env.PORT || 5004;

// Connect to MongoDB
connectDB();


app.use(cors()); 
app.use(express.json()); // Middleware to parse JSON



// User-related routes → `/api/user/`
app.use("/api/comment",verifyToken, commentRoutes);


app.listen(port,()=>{
  console.log(`comment service is running on port ${port}`);
})