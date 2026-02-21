import ChatPage from "./pages/ChatPage";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/chat.css";

export default function App() {
  return (
    <ThemeProvider>
      <ChatPage />
    </ThemeProvider>
  );
}
