import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { Toaster } from "react-hot-toast";
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#363636",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              borderRadius: "10px",
            },
            success: {
              iconTheme: {
                primary: "#16a34a",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
