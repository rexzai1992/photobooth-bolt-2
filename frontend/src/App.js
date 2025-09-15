import "./App.css";
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";  
import Home from "./components/Home";
import Welcome from "./components/Welcome";
import PhotoBooth from "./components/PhotoBooth";
import PhotoPreview from "./components/PhotoPreview";

function App() {
  const [capturedImages, setCapturedImages] = useState([]);

  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/photobooth" element={<PhotoBooth setCapturedImages={setCapturedImages} />} />
        <Route path="/preview" element={<PhotoPreview capturedImages={capturedImages} />} />
      </Routes>
  );
}

export default App;
