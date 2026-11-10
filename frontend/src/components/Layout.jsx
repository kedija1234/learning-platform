import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-layout-area">
        <main className="main-content">
          <div className="content-container">
            {children || <Outlet />}
          </div>
        </main>
        <footer className="footer">
          <div className="footer-container">
            <p>© 2026 University Learning & Internship Platform.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
