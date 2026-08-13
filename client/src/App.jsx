import React, { useEffect, useState } from "react";

const AU_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "Cameroon", "South Africa", "Egypt", "Morocco",
  "Senegal", "Côte d'Ivoire", "Ethiopia", "Tanzania", "Uganda", "Rwanda",
  "Zambia", "Zimbabwe", "Botswana", "Namibia", "Other",
];

const emptyProfile = {
  name: "",
  country: "",
  productCategory: "",
  productDescription: "",
  inputsOrigin: "",
  registrationNumber: "",
  registrationCountry: "",
  contactEmail: "",
  contactPhone: "",
};

export default function App() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [business, setBusiness] = useState(null);
  const [destinationCountry, setDestinationCountry] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const updateProfile = (field) => (e) =>
    setProfile((p) => ({ ...p, [field]: e.target.value }));

  async function handleCreateBusiness(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setBusiness(data.business);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCertificate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${business.id}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationCountry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setCertificate(data.certificate);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <span className="mark">PK</span>
        </div>
        <h1>PassKonnect</h1>
        <p>A digital trade-readiness profile for African MSMEs.</p>
      </header>

      <ol className="steps">
        <li className={step > 1 ? "done" : step === 1 ? "active" : ""}>
          <span className="step-label">Build your profile</span>
        </li>
        <li className={step > 2 ? "done" : step === 2 ? "active" : ""}>
          <span className="step-label">Pick a destination</span>
        </li>
        <li className={step === 3 ? "active" : ""}>
          <span className="step-label">Checklist &amp; certificate</span>
        </li>
      </ol>

      {error && <div className="error">{error}</div>}

      {step === 1 && (
        <form className="card" onSubmit={handleCreateBusiness}>
          <h2>Tell us about your business</h2>

          <label>
            Business name
            <input required value={profile.name} onChange={updateProfile("name")} />
          </label>

          <label>
            Country
            <select required value={profile.country} onChange={updateProfile("country")}>
              <option value="">Select a country</option>
              {AU_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Product category
            <select
              required
              value={profile.productCategory}
              onChange={updateProfile("productCategory")}
            >
              <option value="">Select a category</option>
              {(categories.length
                ? categories
                : ["general_merchandise"]
              ).map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label>
            What do you make or sell?
            <textarea
              required
              value={profile.productDescription}
              onChange={updateProfile("productDescription")}
              placeholder="e.g. Handmade leather bags, sold locally and now looking to export."
            />
          </label>

          <label>
            Where do your materials/inputs come from?
            <textarea
              required
              value={profile.inputsOrigin}
              onChange={updateProfile("inputsOrigin")}
              placeholder="e.g. Leather sourced from a tannery in Kano, Nigeria; thread and hardware imported from Turkey."
            />
          </label>

          <label>
            Business registration number (optional)
            <input value={profile.registrationNumber} onChange={updateProfile("registrationNumber")} />
          </label>

          <label>
            Registration country (optional)
            <input value={profile.registrationCountry} onChange={updateProfile("registrationCountry")} />
          </label>

          <label>
            Contact email
            <input required type="email" value={profile.contactEmail} onChange={updateProfile("contactEmail")} />
          </label>

          <label>
            Contact phone (optional)
            <input value={profile.contactPhone} onChange={updateProfile("contactPhone")} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      )}

      {step === 2 && business && (
        <form className="card" onSubmit={handleGenerateCertificate}>
          <h2>Where are you shipping to?</h2>
          <p className="muted">
            We'll generate your export-readiness checklist and a draft AfCFTA Certificate of Origin for this destination.
          </p>

          <label>
            Destination country
            <select required value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)}>
              <option value="">Select a country</option>
              {AU_COUNTRIES.filter((c) => c !== business.country).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Generating…" : "Generate checklist & draft certificate"}
          </button>
        </form>
      )}

      {step === 3 && certificate && (
        <div className="card">
          <h2>You're on your way, {business.name}.</h2>
          <p className="muted">
            Here's what's still needed to export to {certificate.destinationCountry}:
          </p>

          <ul className="checklist">
            {certificate.checklist.map((item, i) => (
              <li key={i}>{item.item}</li>
            ))}
          </ul>

          <a
            className="button"
            href={`/api/certificates/${certificate.id}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Download draft Certificate of Origin (PDF)
          </a>

          <p className="fine-print">
            This is a draft to speed up the real paperwork — it still needs review and
            countersigning by an authorized issuing body before it can be used to claim
            AfCFTA preferential tariff treatment.
          </p>
        </div>
      )}

      <p className="footer">Built by Telnora Technologies · AfCFTA Digital Innovation Challenge</p>
    </div>
  );
}
