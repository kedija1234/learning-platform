import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Demo video URL constant. When empty, a 16:9 placeholder is displayed.
const VIDEO_URL = '';

function ScreenshotFrame({ src, title, description }) {
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (isMounted) setHasImage(true);
    };
    img.onerror = () => {
      if (isMounted) setHasImage(false);
    };
    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div className="screenshot-frame-card">
      <div className="screenshot-frame-screen">
        {hasImage ? (
          <img
            src={src}
            alt={title}
            className="screenshot-img"
          />
        ) : (
          <div className="screenshot-placeholder-box">
            <div className="screenshot-placeholder-inner">
              <p className="screenshot-placeholder-text">Screenshot coming soon</p>
            </div>
          </div>
        )}
      </div>
      <div className="screenshot-frame-caption">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}


export default function Landing() {
  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-title">UniLink</span>
            <span className="landing-brand-sub">University Platform</span>
          </Link>
          <nav className="landing-nav-actions">
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section hero-header landing-hero">
        <div className="landing-hero-content">
          <span className="landing-hero-pill">Academic &amp; Career Integration</span>
          <h1 className="landing-hero-title">
            A Unified Platform for University Learning and Career Opportunities
          </h1>
          <p className="landing-hero-subtitle">
            UniLink connects academic coursework, faculty grading, and corporate internship applications in one streamlined platform for students, faculty mentors, and coordinators.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="btn btn-primary">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-outline">
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* What UniLink Does Section */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Platform Capabilities</span>
          <h2>What UniLink does</h2>
          <p className="section-description">
            Dedicated workflows designed specifically for each participant in the university learning and career ecosystem.
          </p>
        </div>

        <div className="role-blocks-grid">
          <div className="role-block-card">
            <div className="role-block-header">
              <span className="role-tag role-student">Student</span>
              <h3>Students</h3>
            </div>
            <p>
              Browse university courses, view lecture resources, submit assignment solutions, track awarded grades with instructor feedback, and apply directly to corporate internship postings.
            </p>
          </div>

          <div className="role-block-card">
            <div className="role-block-header">
              <span className="role-tag role-mentor">Mentor</span>
              <h3>Faculty Mentors</h3>
            </div>
            <p>
              Publish course curriculums, upload learning resources, issue coursework assignments with deadlines, review student submissions, and award numerical scores with written feedback.
            </p>
          </div>

          <div className="role-block-card">
            <div className="role-block-header">
              <span className="role-tag role-coordinator">Coordinator</span>
              <h3>Internship Coordinators</h3>
            </div>
            <p>
              Post corporate internship opportunities with descriptions and application deadlines, inspect student applicant rosters, and make formal acceptance or rejection decisions.
            </p>
          </div>

          <div className="role-block-card">
            <div className="role-block-header">
              <span className="role-tag role-admin">Administrator</span>
              <h3>Administrators</h3>
            </div>
            <p>
              Inspect user directories across all academic roles, adjust user permissions, toggle account active or deactivated status, and monitor real-time platform statistics.
            </p>
          </div>
        </div>
      </section>

      {/* See It in Action Section */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Interface Tour</span>
          <h2>See it in action</h2>
          <p className="section-description">
            Take a closer look at the key screens powering university courses and internship coordination.
          </p>
        </div>

        <div className="screenshots-grid">
          <ScreenshotFrame
            src="/images/screens/courses.png"
            title="Course Catalog &amp; Curriculums"
            description="Students explore available university courses and access faculty lecture resources."
          />

          <ScreenshotFrame
            src="/images/screens/submissions.png"
            title="Coursework Submissions &amp; Grades"
            description="Students view awarded numerical scores and faculty instructor feedback on assignments."
          />

          <ScreenshotFrame
            src="/images/screens/internships.png"
            title="Internship Postings &amp; Applications"
            description="Coordinators review applicant rosters and record application acceptance decisions."
          />

          <ScreenshotFrame
            src="/images/screens/admin.png"
            title="Platform Management &amp; Analytics"
            description="Administrators manage user account roles and monitor real-time platform metrics."
          />
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Video Walkthrough</span>
          <h2>Demo video</h2>
          <p className="section-description">
            Watch a demonstration of course enrollment, assignment grading, and internship reviews.
          </p>
        </div>

        <div className="demo-video-wrapper">
          {VIDEO_URL ? (
            <div className="demo-video-box">
              {VIDEO_URL.includes('youtube.com') || VIDEO_URL.includes('youtu.be') || VIDEO_URL.includes('vimeo.com') ? (
                <iframe
                  src={VIDEO_URL}
                  title="UniLink Platform Demo"
                  className="demo-video-frame"
                  allowFullScreen
                ></iframe>
              ) : (
                <video src={VIDEO_URL} controls className="demo-video-player">
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="demo-video-placeholder">
              <div className="demo-video-placeholder-inner">
                <svg
                  className="demo-placeholder-icon"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" fill="var(--teal)" stroke="var(--teal)"></polygon>
                </svg>
                <p className="demo-placeholder-title">Demo video coming soon</p>
                <p className="demo-placeholder-note">
                  A recorded walkthrough of student, mentor, and coordinator workflows will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-left">
            <span className="landing-footer-title">UniLink</span>
            <p className="landing-footer-challenge">
              Built for the Brolf Tech Remote Internship Challenge 2026
            </p>
          </div>
          <div className="landing-footer-right">
            <a
              href="https://github.com/kedija1234/learning-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-github-link"
            >
              https://github.com/kedija1234/learning-platform
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}