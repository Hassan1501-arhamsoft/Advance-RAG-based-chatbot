import {Routes, Route} from "react-router-dom";
import Chat from "../features/chat/pages/Chat";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Chat />} />
    </Routes>
  );
}

export default AppRoutes;