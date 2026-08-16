import React from "react";
import { Link } from "react-router-dom";
import BlurText from "../components/BlurText";

export default function Landing() {
  return (
    <>
      <div className="header">
        <div className="brand">
          <span className="mark">PK</span>
        </div>
        <h1>
          <BlurText text="PassKonnect" animateBy="letters" delay={45} />
        </h1>
        <p>
          <BlurText text="A digital trade-readiness profile for African MSMEs." delay={18} />
        </p>
      </div>

      <div className="card">
        <h2>Get export-ready in minutes</h2>
        <p className="muted">
          Build your business profile, get a plain-language export-readiness checklist, generate a draft
          AfCFTA Certificate of Origin, and get verified so buyers across Africa can find and trust you.
        </p>
        <Link to="/signup" className="button">
          Create your PassKonnect profile
        </Link>
        <p className="muted" style={{ marginTop: 4 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

      <div className="card">
        <h2>Looking for a trade partner?</h2>
        <p className="muted">Browse the directory of AfCFTA-ready, verified African MSMEs.</p>
        <Link to="/directory" className="button">
          Browse the MSME directory
        </Link>
      </div>
    </>
  );
}
