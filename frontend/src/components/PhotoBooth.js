import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PhotoBooth = ({ setCapturedImages }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [capturedImages, setImages] = useState([]);
  const [filter, setFilter] = useState("none");
  const [countdown, setCountdown] = useState(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    const handleVisibilityChange = () => {
      if (!document.hidden) startCamera();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const startCamera = async () => {
    try {
      if (videoRef.current?.srcObject) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      videoRef.current.style.transform = "scaleX(-1)"; // mirror preview
      videoRef.current.style.objectFit = "cover";
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const startCountdown = () => {
    if (capturing) return;
    setCapturing(true);

    let photosTaken = 0;
    const newCapturedImages = [];

    const captureSequence = () => {
      if (photosTaken >= 6) {
        setCapturing(false);
        setCapturedImages([...newCapturedImages]);
        setImages([...newCapturedImages]);
        setTimeout(() => navigate("/preview"), 200);
        return;
      }

      let timeLeft = 3;
      setCountdown(timeLeft);

      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        if (timeLeft === 0) {
          clearInterval(timer);
          const imageUrl = capturePhoto();
          if (imageUrl) {
            newCapturedImages.push(imageUrl);
            setImages((prev) => [...prev, imageUrl]);
          }
          photosTaken += 1;
          setTimeout(captureSequence, 500);
        }
      }, 1000);
    };

    captureSequence();
  };

  /** Capture a square photo */
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    // Square output
    const targetSize = 600; // high-res square photo
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Crop the center square from the video
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const size = Math.min(videoWidth, videoHeight); // square crop size

    const startX = (videoWidth - size) / 2;
    const startY = (videoHeight - size) / 2;

    ctx.save();
    ctx.translate(canvas.width, 0); // mirror horizontally
    ctx.scale(-1, 1);
    ctx.filter = filter;

    // Draw cropped square region into square canvas
    ctx.drawImage(
      video,
      startX,
      startY,
      size,
      size,
      0,
      0,
      targetSize,
      targetSize
    );

    ctx.restore();
    ctx.filter = "none";

    return canvas.toDataURL("image/png");
  };

  return (
    <div className="photo-booth">
      {countdown !== null && <h2 className="countdown animate">{countdown}</h2>}

      <div className="photo-container" style={{ display: "flex", gap: "30px" }}>
        {/* Camera preview */}
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            className="video-feed"
            style={{
              width: "600px", // square preview
              height: "600px",
              objectFit: "cover",
              filter: filter,
            }}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Side previews 2x3 grid */}
        <div
          className="preview-side"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 100px)",
            gridTemplateRows: "repeat(3, 100px)", // square thumbs
            gap: "30px",
          }}
        >
          {capturedImages.slice(0, 6).map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Captured ${i + 1}`}
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "5px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="controls" style={{ marginTop: "20px" }}>
        <button onClick={startCountdown} disabled={capturing}>
          {capturing ? "Capturing..." : "Start Capture :)"}
        </button>
      </div>

      <div className="filters" style={{ marginTop: "15px" }}>
        <button onClick={() => setFilter("none")}>No Filter</button>
        <button onClick={() => setFilter("grayscale(100%)")}>Grayscale</button>
        <button onClick={() => setFilter("sepia(100%)")}>Sepia</button>
        <button
          onClick={() =>
            setFilter(
              "grayscale(100%) contrast(120%) brightness(110%) sepia(30%) hue-rotate(10deg) blur(0.4px)"
            )
          }
        >
          Vintage
        </button>
        <button
          onClick={() =>
            setFilter("brightness(130%) contrast(105%) saturate(80%) blur(0.3px)")
          }
        >
          Soft
        </button>
      </div>
    </div>
  );
};

export default PhotoBooth;
