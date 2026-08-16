import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { VERIFICATION_LABELS } from "../lib/constants";

export default function Dashboard() {
  const [businesses, setBusinesses] = useState(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  function loadBusinesses() {
    return api
      .get("/businesses")
      .then((data) => setBusinesses(data.businesses))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function handleDelete(e, business) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${business.name}"? This also removes its certificates and documents.`)) {
      return;
    }
    setError("");
    setDeletingId(business.id);
    try {
      await api.delete(`/businesses/${business.id}`);
      await loadBusinesses();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card">
      <h2>Your businesses</h2>
      {error && <div className="error">{error}</div>}

      {businesses && businesses.length === 0 && (
        <p className="muted">You haven't added a business profile yet.</p>
      )}

      {businesses && businesses.length > 0 && (
        <ul className="entity-list">
          {businesses.map((b) => (
            <li key={b.id}>
              <Link to={`/businesses/${b.id}`} className="entity-list-item">
                <div>
                  <strong>{b.name}</strong>
                  <div className="muted">
                    {b.country} · {b.productCategory.replaceAll("_", " ")}
                  </div>
                </div>
                <div className="entity-list-actions">
                  <span className={`badge badge-${b.verificationStatus}`}>
                    {VERIFICATION_LABELS[b.verificationStatus]}
                  </span>
                  <button
                    type="button"
                    className="icon-button-danger"
                    disabled={deletingId === b.id}
                    onClick={(e) => handleDelete(e, b)}
                    title={`Delete ${b.name}`}
                  >
                    Delete
                  </button>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/businesses/new" className="button">
        + New business
      </Link>
    </div>
  );
}
