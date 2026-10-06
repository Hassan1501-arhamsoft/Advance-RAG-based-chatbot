import express from "express";
import cors from 'cors';
import chatRoutes from './routes/chat.routes.js'
import conversationRoutes from './routes/conversation.routes.js'
import helmet from "helmet"
const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/chat" , chatRoutes );
app.use("/api/conversations", conversationRoutes);

export default app;