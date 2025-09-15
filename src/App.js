import "./App.css";
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Welcome from "./components/Welcome";
import PhotoBooth from "./components/PhotoBooth";
import PhotoPreview from "./components/PhotoPreview";
import AdminApp from "./components/admin/AdminApp";

function App() {
  const [capturedImages, setCapturedImages] = useState([]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/photobooth" element={<PhotoBooth setCapturedImages={setCapturedImages} />} />
        <Route path="/preview" element={<PhotoPreview capturedImages={capturedImages} />} />
        <Route path="/admin" element={<AdminApp />} />
      </Routes>
    </div>
  );
}

export default App;