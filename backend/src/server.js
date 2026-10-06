import app from "./app.js";
import http from "http";
import dotenv from "dotenv";
import {connectDB} from "../src/configs/db.js";



dotenv.config();

await connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});