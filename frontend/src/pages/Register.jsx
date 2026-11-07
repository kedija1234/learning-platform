import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setSubmitting(true);
    try {
      await register(formData);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.friendlyMessage || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create your account</h2>
          <p className="auth-subtitle">
            Join UniLink to learn, submit work and find internships.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="form-control"
                placeholder="Selamawit"
                value={formData.first_name}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="form-control"
                placeholder="Tesfaye"
                value={formData.last_name}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-control"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (at least 8 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="form-control"
              placeholder="Choose a password"
              value={formData.password}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a</label>
            <select
              id="role"
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="student">
                Student: take courses and apply to internships
              </option>
              <option value="mentor">
                Mentor: create courses and grade work
              </option>
              <option value="coordinator">
                Coordinator: post internships and review applicants
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
