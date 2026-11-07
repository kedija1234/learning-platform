import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.friendlyMessage || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>UniLink</h2>
          <p className="auth-subtitle">
            Your courses and internships, in one place.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="form-control"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="demo-accounts-box">
            <p className="demo-title">Local demo accounts:</p>
            <div className="demo-buttons">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() =>
                  handleDemoFill("student@platform.edu", "Password123!")
                }
              >
                Student
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() =>
                  handleDemoFill("mentor@platform.edu", "Password123!")
                }
              >
                Mentor
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() =>
                  handleDemoFill("coordinator@platform.edu", "Password123!")
                }
              >
                Coordinator
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() =>
                  handleDemoFill("admin@platform.edu", "Password123!")
                }
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <p>
            New to UniLink?{" "}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
