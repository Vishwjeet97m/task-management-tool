import express from 'express';
import 'dotenv/config.js';
// import connectDB from './config/db.js';
import searchRoutes from './routes/search.routes.js'
import cors from 'cors';


const app = express();
const port = process.env.PORT || 5006;

// Connect to MongoDB
// connectDB();


app.use(cors()); 
app.use(express.json()); // Middleware to parse JSON



// User-related routes → `/api/user/`
app.use("/api", searchRoutes);


app.listen(port,()=>{
  console.log(`search service is running on port ${port}`);
})