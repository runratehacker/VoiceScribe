import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';



dotenv.config();

const app = express();

const port = process.env.PORT || 8044

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

// API endpoints 
import formRouter from './routes/FormRoute.js';
app.use('/api', formRouter);


import liveRouter from "./routes/LiveRoute.js";
app.use("/api", liveRouter);

import authRouter from './routes/authRoute.js';
app.use('/api/auth', authRouter);



// Routes 

app.get('/', (req, res) => {
    res.send('API is working!')
})



// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
