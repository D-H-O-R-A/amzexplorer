import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create root element
const rootElement = document.getElementById("root");

// Detect active theme (defaulting strictly to dark mode for AMZX Blockchain)
const savedTheme = localStorage.getItem("amzx-ui-theme") || "dark";
const isDark = savedTheme !== "light";

// Create preloader container
const preloader = document.createElement('div');
preloader.id = 'amzx-preloader';
preloader.style.position = 'fixed';
preloader.style.inset = '0';
preloader.style.display = 'flex';
preloader.style.flexDirection = 'column';
preloader.style.alignItems = 'center';
preloader.style.justifyContent = 'center';
preloader.style.zIndex = '99999';
preloader.style.transition = 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.6s cubic-bezier(0.25, 1, 0.5, 1)';

// Amazon Rainforest Deep Cosmic Emerald Dark Background (NO BLUE!)
preloader.style.background = 'radial-gradient(circle at center, #06231a 0%, #03100a 60%, #010503 100%)';

const preloaderContent = document.createElement('div');
preloaderContent.style.display = 'flex';
preloaderContent.style.flexDirection = 'column';
preloaderContent.style.alignItems = 'center';
preloaderContent.style.justifyContent = 'center';

const textColor = '#F8FAFC';
const subtitleColor = '#10B981';
const borderOuter = 'rgba(16, 185, 129, 0.25)';
const borderMiddle = 'rgba(16, 185, 129, 0.45)';
const trackBg = 'rgba(16, 185, 129, 0.1)';

preloaderContent.innerHTML = `
  <div class="preloader-wrapper" style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: scale(0.95); opacity: 0; animation: preloader-entrance 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;">
    
    <!-- HIGH-TECH 3D ORBIT CONCENTRIC LOADER (100% EMERALD GREEN) -->
    <div class="logo-container" style="width: 120px; height: 120px; position: relative; display: flex; align-items: center; justify-content: center;">
      <!-- Outer Rotating Segment Ring -->
      <div class="ring outer-ring" style="position: absolute; inset: 0; border: 2px dashed ${borderOuter}; border-radius: 50%; animation: spin-clockwise 8s linear infinite;"></div>
      
      <!-- Middle Pulse Ring -->
      <div class="ring middle-ring" style="position: absolute; inset: 14px; border: 2px solid ${borderMiddle}; border-top-color: #10B981; border-bottom-color: #047857; border-radius: 50%; animation: spin-counter 2.5s cubic-bezier(0.53, 0.21, 0.43, 0.89) infinite;"></div>
      
      <!-- Glowing Active Core Logo -->
      <div class="logo-core" style="position: absolute; inset: 26px; display: flex; align-items: center; justify-content: center;">
        <img src="/logo.png" alt="AMZ Logo" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.75));" />
      </div>
    </div>

    <!-- TYPOGRAPHY WITH DUAL TONE GREEN GRADIENT -->
    <div class="brand-text-wrapper" style="text-align: center; margin-top: 30px; z-index: 10;">
      <h1 class="brand-title" style="margin: 0; font-family: 'Orbitron', 'Syncopate', monospace, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 6px; color: ${textColor}; text-transform: uppercase;">
        AMZ <span style="background: linear-gradient(90deg, #34D399, #10B981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Explorer</span>
      </h1>
      <p class="brand-subtitle" style="margin: 8px 0 0 0; font-family: monospace, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 3px; color: ${subtitleColor}; text-transform: uppercase;">
        Amazonic One Blockchain
      </p>
    </div>

    <!-- SCIENTIFIC PROGRESS LOAD BAR (EMERALD GREEN) -->
    <div class="progress-container" style="margin-top: 22px; width: 220px; height: 3px; background: ${trackBg}; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid rgba(16, 185, 129, 0.2);">
      <div class="progress-bar-fill" style="position: absolute; top: 0; left: 0; height: 100%; width: 45%; background: linear-gradient(90deg, #34D399, #10B981, #059669); border-radius: 10px; animation: progress-fill-step 1.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; box-shadow: 0 0 10px #10B981;"></div>
    </div>
  </div>

  <style>
    @keyframes preloader-entrance {
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes spin-clockwise {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes spin-counter {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes progress-fill-step {
      0% { width: 0%; }
      35% { width: 45%; }
      70% { width: 80%; }
      100% { width: 100%; }
    }
  </style>
`;

preloader.appendChild(preloaderContent);
document.body.appendChild(preloader);

// Set body background to deep dark immediately
document.body.style.background = '#010503';

// Load fonts and app with visual polish
const fontsToLoad = [
  'https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'
];

// Promise to load all fonts
Promise.all(
  fontsToLoad.map(url => {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.href = url;
      link.rel = 'stylesheet';
      link.onload = () => resolve(url);
      link.onerror = () => resolve(url); // Don't block if font fails
      document.head.appendChild(link);
    });
  })
)
.then(() => {
  // Render the React application with a controlled, fluid transition
  setTimeout(() => {
    if (rootElement) {
      const appWrapper = document.createElement('div');
      appWrapper.className = 'app-wrapper';
      appWrapper.style.minHeight = '100vh';
      rootElement.appendChild(appWrapper);
      
      createRoot(appWrapper).render(
        <App />
      );
      
      // Fade out the preloader
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
      
      // Remove preloader from DOM once faded
      setTimeout(() => {
        preloader.remove();
      }, 600);
    }
  }, 1200); // Fast, fluid loading time
})
.catch(() => {
  if (rootElement) {
    createRoot(rootElement).render(
      <App />
    );
    preloader.remove();
  }
});
