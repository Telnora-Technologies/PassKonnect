import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Create your PassKonnect account</h2>
      {error && <div className="error">{error}</div>}

      <label>
        Email
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label>
        Password
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="hint">At least 8 characters.</span>
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Sign up"}
      </button>

      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
