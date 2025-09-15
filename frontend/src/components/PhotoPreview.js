import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const PhotoPreview = ({ capturedImages }) => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [bgColor, setBgColor] = useState("#ffffff");

  const drawPhotoStrip = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || capturedImages.length === 0) return;
    const ctx = canvas.getContext("2d");

    /** === Layout ===
     * Canvas: 4×6 inches at 300 DPI → 1200×1800 px
     * 2 columns × 3 rows
     * Adjustable gaps between photos
     */
    const cols = 2;
    const rows = 3;

    // Canvas size at 300dpi
    const stripWidth = 1200;   // 4 inches
    const stripHeight = 1800;  // 6 inches
    canvas.width = stripWidth;
    canvas.height = stripHeight;

    // Gap between photos and edges
    const gapX = 30;  // horizontal gap
    const gapY = 30;  // vertical gap between rows
    const bottomGap = 50; // extra gap at bottom for footer text

    // Calculate frame width/height dynamically
    const frameWidth = (stripWidth - (cols + 1) * gapX) / cols;
    const frameHeight = (stripHeight - (rows + 1) * gapY - bottomGap) / rows;

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    // Draw each photo
    capturedImages.slice(0, 6).forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const x = gapX + col * (frameWidth + gapX);
        const y = gapY + row * (frameHeight + gapY);

        // Aspect-fit each image into frame
        const ratio = Math.min(frameWidth / img.width, frameHeight / img.height);
        const drawWidth = img.width * ratio;
        const drawHeight = img.height * ratio;
        const offsetX = x + (frameWidth - drawWidth) / 2;
        const offsetY = y + (frameHeight - drawHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Footer after last image
        if (index === capturedImages.length - 1) {
          ctx.fillStyle = "#000";
          ctx.font = "30px Arial"; // large text for high DPI
          ctx.textAlign = "center";
          ctx.fillText("Picapica © 2025", stripWidth / 2, stripHeight - bottomGap / 2);
        }
      };
    });
  }, [capturedImages, bgColor]);

  useEffect(() => {
    drawPhotoStrip();
  }, [drawPhotoStrip]);

  const downloadStrip = () => {
    const link = document.createElement("a");
    link.download = "photostrip.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="photo-preview">
      <h2>Photo Strip Preview</h2>

      <div className="color-options">
        <button onClick={() => setBgColor("#ffffff")}>White</button>
        <button onClick={() => setBgColor("#ffd6d9")}>Pink</button>
        <button onClick={() => setBgColor("#d6ffe8")}>Mint</button>
        <button onClick={() => setBgColor("#f0d6ff")}>Lavender</button>
        <button onClick={() => setBgColor("#fff0d6")}>Peach</button>
        <button onClick={() => setBgColor("#d6f0ff")}>Sky Blue</button>
        <button onClick={() => setBgColor("#fff6d6")}>Soft Yellow</button>
        <button onClick={() => setBgColor("#e6d6ff")}>Lilac</button>
        <button onClick={() => setBgColor("#d6fff6")}>Aqua</button>
        <button onClick={() => setBgColor("#ffd6ff")}>Rose</button>
      </div>

      {/* Preview scaled down in browser */}
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #000",
          marginTop: 10,
          width: "300px", // scaled for screen (preview only)
          height: "450px" // scaled for screen
        }}
      />

      <div className="strip-buttons" style={{ marginTop: 10 }}>
        <button onClick={downloadStrip}>📥 Download Photo Strip</button>
        <button onClick={() => navigate("/")}>🔄 Take New Photos</button>
      </div>
    </div>
  );
};

export default PhotoPreview;
