import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config(); //for reading .env file
const app = express();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve(); //for using __dirname with ES6 modules

app.use(cors({ origin: "http://localhost:5173", credentials: true })); //for allowing cross-origin requests

app.use(express.json()); //for parsing json data from request body
app.use(cookieParser()); //for parsing cookies from request headers
app.use("/api/auth", authRoutes); //for routing to authRoutes

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder for frontend
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  //for serving index.html file
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
