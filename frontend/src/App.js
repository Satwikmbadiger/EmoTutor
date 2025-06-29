import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import Signup from "./Signup";
import Login from "./Login";
import Home from "./Home";
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

function DraggableWebcam({ emotion, onEmotionDetected, visible, onClose }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 260, y: 64 });
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);

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

  // Drag handlers
  const onMouseDown = (e) => {
    if (e.target === containerRef.current || containerRef.current.contains(e.target)) {
      setDragging(true);
      containerRef.current.style.cursor = "grabbing";
      containerRef.current.initialX = e.clientX - position.x;
      containerRef.current.initialY = e.clientY - position.y;
      e.preventDefault();
    }
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const x = e.clientX - containerRef.current.initialX;
    const y = e.clientY - containerRef.current.initialY;
    setPosition({ x, y });
  };

  const onMouseUp = () => {
    setDragging(false);
    if (containerRef.current) containerRef.current.style.cursor = "grab";
  };

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

      const res = await fetch(`${API_URL}/api/detect-emotion`, {
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

  return (
    <div
      ref={containerRef}
      className="webcam-container"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ top: position.y, left: position.x }}
      title="Drag me!"
    >
      <button className="webcam-close" onClick={onClose}>
        ✕
      </button>
      <video
        ref={videoRef}
        className="webcam-video"
        autoPlay
        muted
        playsInline
      />
      <div className="webcam-info">
        {detecting
          ? <span>Detecting emotion...</span>
          : error
          ? <span style={{ color: 'var(--error)' }}>{error}</span>
          : <span>Emotion: <strong>{emotion}</strong></span>
        }
      </div>
    </div>
  );
}

function Chat() {
  const { currentUser } = useAuth();
  const [pdfFile, setPdfFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [emotion, setEmotion] = useState("neutral");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [webcamVisible, setWebcamVisible] = useState(true);
  const [chats, setChats] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentSession, setCurrentSession] = useState([]);

  // Load user's chat history from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, "chats"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })));
    });
    
    return unsubscribe;
  }, [currentUser]);

  const uploadPdf = async (e) => {
    const file = e.target.files[0];
    setPdfFile(file);
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) alert("PDF uploaded and processed!");
      else alert("Upload failed: " + data.error);
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || !currentUser) return;
    setAsking(true);
    setResponse("");

    try {
      const res = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, emotion }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setResponse(data.answer);
        
        // Add to current session
        const newMessage = {
          question: question,
          answer: data.answer,
          emotion: emotion,
          timestamp: new Date()
        };
        setCurrentSession(prev => [...prev, newMessage]);
        
        // Save chat to Firestore
        await addDoc(collection(db, "chats"), {
          uid: currentUser.uid,
          question: question,
          answer: data.answer,
          emotion: emotion,
          createdAt: serverTimestamp()
        });
      } else {
        setResponse("Error: " + data.error);
      }
    } catch (err) {
      setResponse("Request failed: " + err.message);
    } finally {
      setAsking(false);
    }
  };

  const startNewChat = () => {
    setCurrentSession([]);
    setSelectedChat(null);
    setQuestion("");
    setResponse("");
  };

  const clearAllChats = async () => {
    if (!currentUser) return;
    
    try {
      const deletePromises = chats.map(chat => 
        deleteDoc(doc(db, "chats", chat.id))
      );
      await Promise.all(deletePromises);
      setShowClearConfirm(false);
      setCurrentSession([]);
      setSelectedChat(null);
    } catch (error) {
      console.error("Error clearing chats:", error);
      alert("Failed to clear chat history");
    }
  };

  const deleteSingleChat = async (chatId) => {
    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setCurrentSession([]);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = (email) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>TeachAI + Emote</h2>
          <button className="new-chat-btn" onClick={startNewChat}>
            + New Chat
          </button>
        </div>
        
        <div className="sidebar-content">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-history-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedChat(chat);
                setCurrentSession([]);
              }}
            >
              <div className="chat-history-question">
                {chat.question.length > 50 
                  ? chat.question.substring(0, 50) + '...' 
                  : chat.question
                }
              </div>
              <div className="chat-history-meta">
                {chat.createdAt.toLocaleTimeString()} - {chat.emotion}
              </div>
              <button 
                className="chat-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSingleChat(chat.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {getUserInitials(currentUser?.email)}
            </div>
            <div className="user-details">
              <div className="user-email">{currentUser?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <h2>
            {selectedChat ? 'Previous Conversation' : 'New Chat'}
          </h2>
          <div className="chat-actions">
            <button 
              className="btn btn-ghost"
              onClick={() => setWebcamVisible((v) => !v)}
            >
              {webcamVisible ? "Hide Webcam" : "Show Webcam"}
            </button>
            {chats.length > 0 && (
              <button 
                className="btn btn-ghost"
                onClick={() => setShowClearConfirm(true)}
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {/* File Upload */}
          <div className="file-upload" onClick={() => document.getElementById('pdf-upload').click()}>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={uploadPdf}
              disabled={uploading}
            />
            <div>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>📄</div>
              <p>
                {uploading ? "Uploading and processing PDF..." : "Click to upload PDF study materials"}
              </p>
            </div>
          </div>

          {/* Selected Chat from History */}
          {selectedChat && (
            <div className="message-group">
              <div className="message user">{selectedChat.question}</div>
              <div className="message bot">{selectedChat.answer}</div>
              <div className="message-meta">
                {selectedChat.createdAt.toLocaleString()} - Emotion: {selectedChat.emotion}
              </div>
            </div>
          )}

          {/* Current Session Messages */}
          {currentSession.map((msg, index) => (
            <div key={index} className="message-group">
              <div className="message user">{msg.question}</div>
              <div className="message bot">{msg.answer}</div>
              <div className="message-meta">
                {msg.timestamp.toLocaleString()} - Emotion: {msg.emotion}
              </div>
            </div>
          ))}

          {/* Current Response */}
          {response && (
            <div className="message-group">
              <div className="message user">{question}</div>
              <div className="message bot">{response}</div>
            </div>
          )}

          {/* Empty State */}
          {!selectedChat && currentSession.length === 0 && !response && (
            <div style={{ 
              textAlign: 'center', 
              color: 'var(--text-muted)', 
              marginTop: 'var(--spacing-2xl)',
              padding: 'var(--spacing-2xl)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>💬</div>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-primary)' }}>
                How can I help you today?
              </h3>
              <p>Start a conversation by asking a question about your study materials.</p>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Message TeachAI + Emote..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={asking}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && askQuestion()}
            />
            <button
              className="send-button"
              onClick={askQuestion}
              disabled={asking || !question.trim()}
            >
              {asking ? (
                <span className="loading"></span>
              ) : (
                "→"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Clear Chat History</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete all your chat history? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={clearAllChats}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <DraggableWebcam
        emotion={emotion}
        onEmotionDetected={setEmotion}
        visible={webcamVisible}
        onClose={() => setWebcamVisible(false)}
      />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;