import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./App.css";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      <nav className="home-nav">
        <Link to="/" className="home-nav-link">EmoTutor</Link>
      </nav>

      <main className="home-main">
        <h1 className="home-title">Your AI Tutor, Powered by Emotion</h1>
        <p className="home-subtitle">
          EmoTutor adapts to your feelings and helps you learn smarter. Upload your study materials and chat with an AI that understands you.
        </p>
        <div className="home-actions">
          {currentUser ? (
            <Link to="/chat" className="btn btn-primary home-btn">Go to Chat</Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary home-btn">Get Started</Link>
              <Link to="/login" className="btn btn-outline home-btn">Sign In</Link>
            </>
          )}
        </div>
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Emotion-Aware</h3>
            <p className="feature-description">AI adapts its teaching style based on your emotional state for the most effective learning.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3 className="feature-title">Upload PDFs</h3>
            <p className="feature-description">Upload your study materials, notes, or textbooks and get instant answers to your questions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">Chat & Learn</h3>
            <p className="feature-description">Engage in natural conversations and get detailed explanations for complex topics.</p>
          </div>
        </div>
      </main>

      <section className="how-it-works-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
              <div className="step-card">
                  <div className="step-icon">1️⃣</div>
                  <h3 className="step-title">Upload Your Document</h3>
                  <p className="step-description">Start by uploading your PDF study material. We'll process it and get it ready for your learning session.</p>
              </div>
              <div className="step-card">
                  <div className="step-icon">2️⃣</div>
                  <h3 className="step-title">Enable Your Webcam</h3>
                  <p className="step-description">Allow access to your webcam so our AI can analyze your emotions and tailor the lesson to your mood.</p>
              </div>
              <div className="step-card">
                  <div className="step-icon">3️⃣</div>
                  <h3 className="step-title">Start Learning</h3>
                  <p className="step-description">Ask questions, get explanations, and enjoy a personalized learning experience that adapts to you.</p>
              </div>
          </div>
      </section>

      <footer className="home-footer">
        <div className="container">
          <p>&copy; 2025 EmoTutor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 