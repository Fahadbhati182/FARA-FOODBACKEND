import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./lib/db.js";
import connectCloudinary from "./lib/cloudinary.js";
import userRouter from "./routes/auth.routes.js";


await connectDB();
connectCloudinary();

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
  
// Middleware
app.use(express.json());
app.use(cors({ origin: allowedOrigins, withCredentials: true }));


// routes

app.use("/api/auth",userRouter)


app.use("/", (req, res) => {
  res.send("Welcome to the FARA Food Delivery API!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});