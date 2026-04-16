import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


//backend dependency install:

//1:tools designed for production-ready AI applications
//npm install langchain @langchain/core
//LangChain.js is open-source and can be used in various JavaScript environments, including Node.js, Cloudflare Workers, and modern frontend frameworks like Next.js and React.
//1.LangGraph:A low-level framework for building more complex, stateful agents and controllable workflows using a graph-based approach.
//2.LangSmith: A unified platform for debugging, testing, and monitoring LLM applications, offering deep visibility into agent execution paths and runtime metrics.

//2:Node.js, Express