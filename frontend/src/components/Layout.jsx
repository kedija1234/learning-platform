import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <div className="content-container">
          <Outlet />
        </div>
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>© 2026 University Learning & Internship Platform. Brolf Tech Challenge.</p>
        </div>
      </footer>
    </div>
  );
}
