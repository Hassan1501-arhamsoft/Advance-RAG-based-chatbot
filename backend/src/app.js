import express from "express";
import cors from 'cors';
import chatRoutes from './routes/chat.routes.js'
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/chat" , chatRoutes );

export default app;