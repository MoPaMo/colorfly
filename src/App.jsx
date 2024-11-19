// src/App.jsx
import React, { useState, useEffect } from "react";
import { CirclePicker } from "react-color"; // Using CirclePicker as color wheel
import { saveAs } from "file-saver";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Utility Functions
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
    .padStart(2, "0");
  const g = Math.round((gPrime + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round((bPrime + m) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
};

// Palette Display Component
const PaletteDisplay = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const colorsParam = queryParams.get("colors");
  const colors = colorsParam ? colorsParam.split(",") : [];

  if (colors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4">No Palette Found</h1>
        <p className="text-lg mb-6">
          Please generate a palette to create a shareable link.
        </p>
        <a href="/" className="text-blue-500 hover:underline">
          Go Back
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Your Shared Palette</h1>
      <div className="flex flex-wrap justify-center gap-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className="w-24 h-24 rounded-lg cursor-pointer relative overflow-hidden shadow-md"
            style={{ backgroundColor: color }}
            onClick={() => navigator.clipboard.writeText(color)}
          >
            <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 text-sm px-2 py-1 rounded">
              {color}
            </span>
          </div>
        ))}
      </div>
      <a href="/" className="mt-6 text-blue-500 hover:underline">
        Go Back
      </a>
    </div>
  );
};

// Main App Component
const App = () => {
  const [colors, setColors] = useState([]);
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const navigate = useNavigate();

  // Register service worker for PWA
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

  // Share palette using Web Share API or fallback
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
      // Fallback for browsers that don't support Web Share API
      const blob = new Blob([JSON.stringify(paletteData, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, "colorfly-palette.json");
    }
  };

  // Handle generating shareable link
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

  // Available colors for the color wheel (preset colors)
  const colorWheelColors = [
    "#FF6900",
    "#FCB900",
    "#7BDCB5",
    "#00D084",
    "#8ED1FC",
    "#0693E3",
    "#ABB8C3",
    "#EB144C",
    "#F78DA7",
    "#9900EF",
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-600">Colorfly</h1>

      <div className="mb-6">
        <CirclePicker
          colors={colorWheelColors}
          color={currentColor}
          onChangeComplete={(color) => setCurrentColor(color.hex)}
          width="280px"
        />
      </div>

      <button
        onClick={generatePalette}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mb-6 transition"
      >
        Generate Palette
      </button>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {colors.map((color, index) => (
          <div
            key={index}
            className="w-24 h-24 rounded-lg cursor-pointer relative overflow-hidden shadow-md transform hover:scale-105 transition"
            style={{ backgroundColor: color }}
            onClick={() => navigator.clipboard.writeText(color)}
          >
            <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 text-sm px-2 py-1 rounded">
              {color}
            </span>
          </div>
        ))}
      </div>

      {colors.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={sharePalette}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Share Palette
          </button>
          <button
            onClick={handleGenerateLink}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Generate Shareable Link
          </button>
        </div>
      )}
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
