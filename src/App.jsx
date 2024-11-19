// ~/Desktop/Projects/colorfly/src/App.jsx
import React, { useState, useEffect } from "react";
import { SketchPicker } from "react-color"; 
import { saveAs } from "file-saver";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";


const hexToHSL = (hex) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
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
    .padStart(2, "0");
  const g = Math.round((gPrime + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round((bPrime + m) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
};


const PaletteDisplay = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const colorsParam = queryParams.get("colors");
  const colors = colorsParam ? colorsParam.split(",") : [];

  if (colors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4 text-gray-800">No Palette Found</h1>
          <p className="text-lg mb-6 text-gray-600">
            Please generate a palette to create a shareable link.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-4">
      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 w-full max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-6 text-gray-800 text-center">Your Shared Palette</h1>
        <div className="flex flex-wrap justify-center gap-6">
          {colors.map((color, index) => (
            <div
              key={index}
              className="w-32 h-32 rounded-lg cursor-pointer relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300"
              style={{ backgroundColor: color }}
              onClick={() => navigator.clipboard.writeText(color)}
            >
              <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 text-sm px-3 py-1 rounded">
                {color}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center space-x-6">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
            Go Back
          </a>
        </div>
      </div>
    </div>
  );
};


const App = () => {
  const [colors, setColors] = useState([]);
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const navigate = useNavigate();

  
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").then(
          (registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope
            );
          },
          (error) => {
            console.error("ServiceWorker registration failed: ", error);
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
  
  const sharePalette = async () => {
    const paletteData = {
      colors: colors,
      timestamp: new Date().toISOString(),
    };

    const paletteURL = `${window.location.origin}/palette?colors=${colors.join(
      ","
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Colorfly Palette",
          text: `Check out this color palette: ${colors.join(", ")}`,
          url: paletteURL,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      
      const blob = new Blob([JSON.stringify(paletteData, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, "colorfly-palette.json");
    }
  };
  
  const handleGenerateLink = () => {
    if (colors.length === 0) {
      alert("Please generate a palette first.");
      return;
    }
    const paletteURL = `${window.location.origin}/palette?colors=${colors.join(
      ","
    )}`;
    navigator.clipboard
      .writeText(paletteURL)
      .then(() => alert("Palette link copied to clipboard!"))
      .catch((err) => console.error("Failed to copy: ", err));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 flex flex-col items-center p-6">
      <div className="bg-white bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-3xl">
        <h1 className="text-5xl font-extrabold mb-6 text-center text-gray-800 drop-shadow-lg">
          Colorfly
        </h1>

        <div className="mb-8">
          <SketchPicker
            color={currentColor}
            onChangeComplete={(color) => setCurrentColor(color.hex)}
            disableAlpha 
            styles={{
              default: {
                picker: {
                  boxShadow: "none",
                },
                saturation: {
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                },
                controls: {
                  marginTop: "1rem",
                  padding: "0",
                },
                color: {
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                },
              },
            }}
          />
        </div>

        <button
          onClick={generatePalette}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition transform hover:scale-105 duration-300"
        >
          Generate Palette
        </button>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {colors.map((color, index) => (
            <div
              key={index}
              className="w-full h-32 rounded-xl cursor-pointer relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300"
              style={{ backgroundColor: color }}
              onClick={() => navigator.clipboard.writeText(color)}
            >
              <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 text-sm px-3 py-1 rounded">
                {color}
              </span>
            </div>
          ))}
        </div>

        {colors.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={sharePalette}
              className="flex-1 bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition transform hover:scale-105 duration-300"
            >
              Share Palette
            </button>
            <button
              onClick={handleGenerateLink}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition transform hover:scale-105 duration-300"
            >
              Generate Shareable Link
            </button>
          </div>
        )}
      </div>
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

export default Root;