import { useState } from "react";
import ChatBox from "./components/ChatBox";
import "./styles/chat.scss";

function App() {
  return (
    <div className="body">
    <div className="app">
      <h2> RAG Chatbot</h2>
      <ChatBox />
    </div>
    </div>
  );
}

export default App;