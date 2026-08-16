import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Log in</h2>
      {error && <div className="error">{error}</div>}

      <label>
        Email
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label>
        Password
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </button>

      <p className="muted">
        No account yet? <Link to="/signup">Sign up</Link>
      </p>
    </form>
  );
}
