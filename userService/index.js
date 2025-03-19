import express from 'express';
import 'dotenv/config';
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js'

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const router = express.Router();

app.use(express.json()); // Middleware to parse JSON


//authentication routes
router.post('/register', register);
router.post('/login', login);

app.use('/api/users', userRoutes); // Use user routes







app.listen(port,()=>{
  console.log(`user service is running on port ${port}`);
})