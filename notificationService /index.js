import express from 'express';
import 'dotenv/config';
import connectDB from './config/db.js';
import notificationRoutes from './routes/notification.routes.js'
import cors from 'cors';


const app = express();
const port = process.env.PORT || 5005;

// Connect to MongoDB
connectDB();


app.use(cors()); 
app.use(express.json()); // Middleware to parse JSON



// User-related routes → `/api/user/`
app.use("/api/notifications", notificationRoutes);


app.listen(port,()=>{
  console.log(`notification service is running on port ${port}`);
})