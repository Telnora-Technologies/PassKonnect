import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <Link to="/" className="brand-link">
        <span className="mark">PK</span>
        <span className="brand-name">PassKonnect</span>
      </Link>

      <nav className="site-nav">
        <Link to="/directory">Directory</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {user.isAdmin && <Link to="/admin">Admin</Link>}
            <button type="button" className="link-button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="button nav-cta">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
