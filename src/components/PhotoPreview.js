import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadGeneratedPhoto, canvasToBlob } from '../utils/photoUpload';

const PhotoPreview = ({ capturedImages }) => {
  const downloadStrip = () => {
    const link = document.createElement("a");
    link.download = "photostrip.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    
    // Also upload to admin system
    uploadPhotoToAdmin();
  };

  const uploadPhotoToAdmin = async () => {
    try {
      const canvas = canvasRef.current;
      const blob = await canvasToBlob(canvas);
      
      // Generate a season ID based on current date
      const seasonId = `season-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      const metadata = {
        photoCount: capturedImages.length,
        backgroundColor: bgColor,
        stripDimensions: {
          width: canvas.width,
          height: canvas.height
        }
      };
      
      await uploadGeneratedPhoto(blob, seasonId, metadata);
    } catch (error) {
      console.error('Failed to upload photo to admin system:', error);
    }
  };

  return (
  );
};