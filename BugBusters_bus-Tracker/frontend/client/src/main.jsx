import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BusProvider } from "./context/BusContext";
import './index.css'
import App from './App.jsx'
import "leaflet/dist/leaflet.css";
import { BrowserRouter } from "react-router-dom";


createRoot(document.getElementById('root')).render(

  <StrictMode>
    <BusProvider>
      <BrowserRouter>
    <App />
  </BrowserRouter>
    </BusProvider>
  </StrictMode>,
)
