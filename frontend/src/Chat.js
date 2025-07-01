import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import DraggableWebcam from "./DraggableWebcam";

function Navbar({ currentUser, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-brand"><a href="/" style={{ textDecoration: "none" , color: "#10a37f"}}>EmoTutor</a></div>
      <div className="nav-actions">
        <span className="user-email">{currentUser?.email}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

function Chat() {
    const { currentUser } = useAuth();
    // Remove duplicate handleLogout definition
    const [pdfFile, setPdfFile] = useState(null);
    const [question, setQuestion] = useState("");
    const [emotion, setEmotion] = useState("neutral");
    const [uploading, setUploading] = useState(false);
    const [asking, setAsking] = useState(false);
    const [webcamVisible, setWebcamVisible] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [currentSession, setCurrentSession] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentSession]);
  
    const uploadPdf = async (e) => {
      const file = e.target.files[0];
      setPdfFile(file);
      if (!file) return;
      setUploading(true);
  
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        const res = await fetch(`/api/upload-pdf`, {
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
      const currentQuestion = question;
      setAsking(true);
      setQuestion("");
      
      setCurrentSession(prev => [...prev, { question: currentQuestion, answer: null, emotion: emotion, timestamp: new Date() }]);

      try {
        const res = await fetch('/api/ask', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: currentQuestion, emotion }),
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentSession(prev => {
              const newSession = [...prev];
              newSession[newSession.length - 1].answer = data.answer;
              return newSession;
          });
        } else {
            setCurrentSession(prev => {
                const newSession = [...prev];
                newSession[newSession.length - 1].answer = "Error: " + data.error;
                return newSession;
            });
        }
      } catch (err) {
        setCurrentSession(prev => {
            const newSession = [...prev];
            newSession[newSession.length - 1].answer = "Request failed: " + err.message;
            return newSession;
        });
      } finally {
        setAsking(false);
      }
    };
  
    const clearAllChats = () => {
      setCurrentSession([]);
      setShowClearConfirm(false);
      setQuestion("");
    };
  
    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        alert("Error signing out: " + error.message);
      }
    };
  
    const getUserInitials = (email) => {
      return email ? email.split('@')[0].substring(0, 2).toUpperCase() : "";
    };
  
    return (
      <>
        <Navbar currentUser={currentUser} onLogout={handleLogout} />
        <div className="chat-layout">
          <DraggableWebcam
              emotion={emotion}
              onEmotionDetected={setEmotion}
              visible={webcamVisible}
              onClose={() => setWebcamVisible(false)}
          />
          <div className="chat-main">
            <div className="chat-header">
              <div className="chat-actions">
                  <button
                    className="btn btn-ghost"
                    style={{fontWeight: 600, fontSize: '1.05em'}}
                    onClick={() => setWebcamVisible(v => !v)}
                  >
                    {webcamVisible ? "🟢 Hide Webcam" : "🟡 Show Webcam"}
                  </button>
                  {currentSession.length > 0 && (
                    <button className="btn btn-ghost" onClick={() => setShowClearConfirm(true)}>
                      🗑️ Clear Chat
                    </button>
                  )}
              </div>
            </div>
            <div className="chat-messages">
              {currentSession.length === 0 && (
                  <div className="empty-chat-container">
                      <div className="empty-chat-icon">💬</div>
                      <h3>How can I help you today?</h3>
                      <p>Ask me anything about your documents!</p>
                  </div>
              )}
              {currentSession.map((msg, index) => (
               <div key={index} className="message-group">
                 <div className="message user">{msg.question}</div>
                 <div className="message bot">
                   {msg.answer === null ? <span className="loading">Thinking...</span> : 
                      <div style={{ whiteSpace: 'pre-line'}}>
                          {msg.answer}
                      </div>
                   }
                 </div>
               </div>
             ))}
             <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                  <input
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      onChange={uploadPdf}
                      disabled={uploading}
                      style={{ display: 'none' }}
                  />
                  <label htmlFor="pdf-upload" className="file-upload-btn" title="Upload PDF">
                      📄
                  </label>
                  <textarea
                      className="chat-input"
                      placeholder="Message EmoTutor..."
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
                     {asking ? <span className="loading-dot"></span> : "→"}
                  </button>
              </div>
            </div>
          </div>
          {showClearConfirm && (
           <div className="modal-overlay">
             <div className="modal">
               <div className="modal-header">
                 <h3>Clear Chat</h3>
               </div>
               <div className="modal-body">
                 <p>Are you sure you want to clear this chat? This action cannot be undone.</p>
               </div>
               <div className="modal-footer">
                 <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                   Cancel
                 </button>
                 <button className="btn btn-error" onClick={clearAllChats}>
                   Clear
                 </button>
               </div>
             </div>
           </div>
         )}
        </div>
      </>
    );
  }
  
  export default Chat; 