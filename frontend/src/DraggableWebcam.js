import React, { useState, useRef, useEffect } from "react";

function DraggableWebcam({ emotion, onEmotionDetected, visible, onClose }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 32 });
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  
    // Responsive: update isMobile on resize
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= 700);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    // Enable webcam stream
    useEffect(() => {
      if (!visible) return;
      async function enableWebcam() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
          setError(null);
        } catch (err) {
          setError("Could not access webcam: " + err.message);
        }
      }
      enableWebcam();
  
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
      };
    }, [visible]);
  
    // Emotion detection every 5 seconds
    useEffect(() => {
      if (!visible) return;
      const interval = setInterval(() => {
        captureAndDetect();
      }, 5000);
  
      captureAndDetect();
      return () => clearInterval(interval);
    }, [visible]);
  
    // Drag handlers (desktop only)
    const onMouseDown = (e) => {
      if (isMobile || e.target.className.includes('webcam-close')) return;
      setDragging(true);
      containerRef.current.initialX = e.clientX - position.x;
      containerRef.current.initialY = e.clientY - position.y;
    };
  
    const onMouseMove = (e) => {
      if (!dragging) return;
      
      const newX = e.clientX - containerRef.current.initialX;
      const newY = e.clientY - containerRef.current.initialY;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: constrainedX, y: constrainedY });
    };
  
    const onMouseUp = () => {
      setDragging(false);
    };

    useEffect(() => {
        if (!dragging) return;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragging]);
  
    // Emotion detection function
    const captureAndDetect = async () => {
      if (!videoRef.current) return;
      setDetecting(true);
      setError(null);
  
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
  
        const dataUrl = canvas.toDataURL("image/jpeg");
        const blob = await (await fetch(dataUrl)).blob();
  
        const formData = new FormData();
        formData.append("image", blob, "capture.jpg");
  
        const res = await fetch(`/api/detect-emotion`, {
          method: "POST",
          body: formData,
        });
  
        const data = await res.json();
  
        if (res.ok) {
          onEmotionDetected(data.emotion);
          setError(null);
        } else {
          setError(data.error || "Detection error");
        }
      } catch (err) {
        setError("Detection failed: " + err.message);
      } finally {
        setDetecting(false);
      }
    };
  
    if (!visible) return null;
  
    // Style for desktop drag, fixed for mobile
    const style = isMobile
      ? { left: 0, right: 0, top: 56, width: '100vw', height: '90px', borderRadius: 0, position: 'fixed', background: '#fff' }
      : { left: position.x, top: position.y, position: 'fixed', width: '340px', height: '110px', borderRadius: '18px', background: '#fff' };
  
    return (
      <div
        ref={containerRef}
        className={`webcam-container${detecting ? ' detecting' : ''}`}
        style={style}
        onMouseDown={onMouseDown}
      >
        <video
          ref={videoRef}
          className="webcam-video"
          autoPlay
          muted
          playsInline
        />
        <div className="webcam-info" title={emotion ? `Emotion: ${emotion}` : ''}>
          {error ? (
            <span style={{ color: '#ef4444' }}>{error}</span>
          ) : (
            <>
                <span className="emotion-label">Emotion:</span>
                <span className="emotion-value">{emotion}</span>
            </>
          )}
        </div>
        <button className="webcam-close" onClick={onClose} title="Close">✕</button>
      </div>
    );
  }

  export default DraggableWebcam; 