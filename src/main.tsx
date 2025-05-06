import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { faceDetectorPolyfill } from '@/lib/faceDetectionPolyfill'
import { ThemeProvider } from '@/lib/theme-provider'
import '@/lib/i18n' // Import i18n configuration

// Add face detection polyfill
if (!('FaceDetector' in window)) {
  faceDetectorPolyfill()
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
