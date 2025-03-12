import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to FeatureForge</h1>
          <p className="hero-subtitle">
            The ultimate tool for managing and prioritizing product feature requests
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="button primary">
              Get Started
            </Link>
            <a href="#features" className="button secondary">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <h2>Key Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Feature Request Management</h3>
            <p>Easily create, track, and manage feature requests in one place.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Prioritization Tools</h3>
            <p>Use data-driven methods to prioritize features based on impact and effort.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Team Collaboration</h3>
            <p>Collaborate with your team to evaluate and discuss feature requests.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Visualize feature request data with powerful analytics tools.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to streamline your feature prioritization?</h2>
        <p>Join FeatureForge today and start making better product decisions.</p>
        <Link to="/signup" className="button primary">
          Sign Up Now
        </Link>
      </section>
    </div>
  );
};

export default Home; 