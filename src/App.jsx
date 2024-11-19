import React, { useState, useEffect } from 'react';
import { SketchPicker } from 'react-color';
import { saveAs } from 'file-saver';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';

// Utility Functions
const hexToHSL = (hex) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
      default:
        break;
    }
  }

  return { h, s: s * 100, l: l * 100 };
};

const HSLToHex = (h, s, l) => {
  s /= 100;
  l /= 100;

  const c = 2 * l * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rPrime, gPrime, bPrime;

  if (0 <= h && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (60 <= h && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (120 <= h && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (180 <= h && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (240 <= h && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  const r = Math.round((rPrime + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round((gPrime + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round((bPrime + m) * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${r}${g}${b}`;
};

// Palette Display Component
const PaletteDisplay = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const colorsParam = queryParams.get('colors');
  const colors = colorsParam ? colorsParam.split(',') : [];

  if (colors.length === 0) {
    return (
      <div className="app">
        <h1>No Palette Found</h1>
        <p>Please generate a palette to create a shareable link.</p>
        <a href="/">Go Back</a>
        <style jsx>{paletteStyles}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Your Shared Palette</h1>
      <div className="palette">
        {colors.map((color, index) => (
          <div
            key={index}
            className="color-swatch"
            style={{ backgroundColor: color }}
            onClick={() => navigator.clipboard.writeText(color)}
          >
            <span>{color}</span>
          </div>
        ))}
      </div>
      <a href="/">Go Back</a>
      <style jsx>{paletteStyles}</style>
    </div>
  );
};

// Main App Component
const App = () => {
  const [colors, setColors] = useState([]);
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const navigate = useNavigate();

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (error) => {
            console.error('ServiceWorker registration failed: ', error);
          }
        );
      });
    }
  }, []);

  
  const generatePalette = () => {
    const hsl = hexToHSL(currentColor);
    const palette = [];

    
    for (let i = 0; i < 5; i++) {
      
      const randomOffset = Math.random() * 30 - 15; 
      const randomSaturation = Math.random() * 20 - 10; 
      const randomLightness = Math.random() * 20 - 10; 

      let h = (hsl.h + i * 30 + randomOffset) % 360;
      if (h < 0) h += 360; 

      let s = Math.min(Math.max(hsl.s + randomSaturation, 0), 100);
      let l = Math.min(Math.max(hsl.l + randomLightness, 0), 100);

      palette.push(HSLToHex(h, s, l));
    }

    setColors(palette);
  };

  // Share palette using Web Share API or fallback
  const sharePalette = async () => {
    const paletteData = {
      colors: colors,
      timestamp: new Date().toISOString(),
    };

    const paletteURL = `${window.location.origin}/palette?colors=${colors.join(',')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Colorfly Palette',
          text: `Check out this color palette: ${colors.join(', ')}`,
          url: paletteURL,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: 'application/json' });
      saveAs(blob, 'colorfly-palette.json');
    }
  };

  
  const handleGenerateLink = () => {
    if (colors.length === 0) {
      alert('Please generate a palette first.');
      return;
    }
    const paletteURL = `${window.location.origin}/palette?colors=${colors.join(',')}`;
    navigator.clipboard.writeText(paletteURL)
      .then(() => alert('Palette link copied to clipboard!'))
      .catch((err) => console.error('Failed to copy: ', err));
  };

  return (
    <div className="app">
      <h1>Colorfly</h1>

      <div className="color-picker">
        <SketchPicker
          color={currentColor}
          onChangeComplete={(color) => setCurrentColor(color.hex)}
        />
      </div>

      <button onClick={generatePalette}>Generate Palette</button>

      <div className="palette">
        {colors.map((color, index) => (
          <div
            key={index}
            className="color-swatch"
            style={{ backgroundColor: color }}
            onClick={() => navigator.clipboard.writeText(color)}
          >
            <span>{color}</span>
          </div>
        ))}
      </div>

      {colors.length > 0 && (
        <>
          <button onClick={sharePalette}>Share Palette</button>
          <button onClick={handleGenerateLink}>Generate Shareable Link</button>
        </>
      )}

      <style jsx>{styles}</style>
    </div>
  );
};


const Root = () => (
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/palette" element={<PaletteDisplay />} />
    </Routes>
  </Router>
);


const styles = `
  .app {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
    font-family: Arial, sans-serif;
  }

  .color-picker {
    margin: 20px 0;
    display: flex;
    justify-content: center;
  }

  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0;
    justify-content: center;
  }

  .color-swatch {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
    position: relative;
  }

  .color-swatch:hover {
    transform: scale(1.05);
  }

  .color-swatch span {
    position: absolute;
    bottom: 5px;
    background: rgba(255, 255, 255, 0.8);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
    margin: 10px;
    transition: background 0.3s;
  }

  button:hover {
    background: #0056b3;
  }

  a {
    display: inline-block;
    margin-top: 20px;
    color: #007bff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const paletteStyles = `
  .app {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
    font-family: Arial, sans-serif;
  }

  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0;
    justify-content: center;
  }

  .color-swatch {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
    position: relative;
  }

  .color-swatch:hover {
    transform: scale(1.05);
  }

  .color-swatch span {
    position: absolute;
    bottom: 5px;
    background: rgba(255, 255, 255, 0.8);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  a {
    display: inline-block;
    margin-top: 20px;
    color: #007bff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;


export default Root;