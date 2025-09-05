import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ChatBot from './components/chat-bot.jsx'
import OpenChatBtn from './components/open-chat-btn.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OpenChatBtn/>
  </StrictMode>,
)
