import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { VERIFICATION_LABELS } from "../lib/constants";

const STATUS_ICON = {
  verified: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2 4 5v6c0 5.1 3.4 9.4 8 11 4.6-1.6 8-5.9 8-11V5l-8-3Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M12 2 4 5v6c0 5.1 3.4 9.4 8 11 4.6-1.6 8-5.9 8-11V5l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 12.2 11 14.7l4.8-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  unverified: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="0.9" fill="currentColor" />
    </svg>
  ),
};

const STATUS_NOTE = {
  verified:
    "PassKonnect has reviewed this business's registration and tax documents and confirmed its details.",
  pending:
    "This business has submitted documents and is currently under PassKonnect review.",
  unverified:
    "This business hasn't completed PassKonnect's document verification yet. Its details are self-reported.",
};

export default function PublicProfile() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/public/businesses/${id}`)
      .then((data) => setBusiness(data.business))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="card">
        <h2>Profile not found</h2>
        <p className="muted">This PassKonnect profile doesn't exist or isn't public.</p>
        <Link to="/directory" className="button">
          Browse the directory
        </Link>
      </div>
    );
  }

  if (!business) return null;

  const status = business.verificationStatus;
  const initial = business.name.trim().charAt(0).toUpperCase();

  return (
    <div className="profile-card">
      <div className={`profile-hero profile-hero-${status}`}>
        <div className="profile-avatar">{initial}</div>
        <h2>{business.name}</h2>
        <p className="profile-location">
          {business.country} · {business.productCategory.replaceAll("_", " ")}
        </p>
        <div className={`profile-status-pill profile-status-pill-${status}`}>
          <span className="status-icon">{STATUS_ICON[status]}</span>
          {VERIFICATION_LABELS[status]}
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-stats">
          <div className="stat-tile">
            <span className="stat-label">Country</span>
            <span className="stat-value">{business.country}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Category</span>
            <span className="stat-value">{business.productCategory.replaceAll("_", " ")}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Member since</span>
            <span className="stat-value">{new Date(business.createdAt).getFullYear()}</span>
          </div>
        </div>

        <section className="profile-section">
          <h3>About</h3>
          <p>{business.productDescription}</p>
        </section>

        <div className={`trust-note trust-note-${status}`}>
          <span className="status-icon">{STATUS_ICON[status]}</span>
          <p>{STATUS_NOTE[status]}</p>
        </div>

        <p className="fine-print" style={{ textAlign: "center", marginTop: 4 }}>
          Verified via PassKonnect · digital trade-readiness identity for African MSMEs
        </p>

        <Link to="/directory" className="button" style={{ marginTop: 4 }}>
          Browse more verified MSMEs
        </Link>
      </div>
    </div>
  );
}
