import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./App.css";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div>
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            TeachAI + Emote
          </Link>
          <div className="nav-menu">
            {currentUser ? (
              <Link to="/chat" className="btn btn-primary">
                Go to Chat
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            AI-Powered Learning with Emotion Detection
          </h1>
          <p className="hero-subtitle">
            Experience personalized education that adapts to your emotional state. 
            Upload your study materials and get intelligent responses tailored to how you're feeling.
          </p>
          
          {!currentUser && (
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary">
                Start Learning Now
              </Link>
              <Link to="/login" className="btn btn-outline">
                I already have an account
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Choose TeachAI + Emote?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Emotion-Aware Responses</h3>
              <p className="feature-description">
                Our AI adapts its teaching style based on your emotional state, 
                providing the most effective learning experience.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="feature-title">PDF Document Support</h3>
              <p className="feature-description">
                Upload your study materials, notes, or textbooks and get 
                instant answers to your questions.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Interactive Chat</h3>
              <p className="feature-description">
                Engage in natural conversations with your AI tutor and get 
                detailed explanations for complex topics.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-description">
                Your data is protected with enterprise-grade security. 
                Your conversations and documents stay private.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">1️⃣</div>
              <h3 className="feature-title">Upload Your Materials</h3>
              <p className="feature-description">
                Upload PDF documents, notes, or any study material you want to learn from.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">2️⃣</div>
              <h3 className="feature-title">Enable Emotion Detection</h3>
              <p className="feature-description">
                Allow camera access to let our AI understand your emotional state during learning.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">3️⃣</div>
              <h3 className="feature-title">Ask Questions</h3>
              <p className="feature-description">
                Ask any question about your materials and get personalized responses based on your emotions.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">4️⃣</div>
              <h3 className="feature-title">Learn & Grow</h3>
              <p className="feature-description">
                Track your progress and continue learning with an AI that understands how you feel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ 
        backgroundColor: 'var(--bg-tertiary)', 
        padding: 'var(--spacing-xl) 0',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div className="container">
          <p>&copy; 2024 TeachAI + Emote. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 