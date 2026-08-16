import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../lib/api";
import { AU_COUNTRIES, VERIFICATION_LABELS } from "../lib/constants";

const DOC_TYPE_LABELS = {
  business_registration: "Business registration certificate",
  tax_id: "Tax Identification Number (TIN) proof",
  other: "Other supporting document",
};

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [deletingBusiness, setDeletingBusiness] = useState(false);

  const [destinationCountry, setDestinationCountry] = useState("");
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState("");

  const [docType, setDocType] = useState("business_registration");
  const [docFile, setDocFile] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [deletingDocId, setDeletingDocId] = useState(null);

  const publicUrl = `${window.location.origin}/p/${id}`;

  function loadBusiness() {
    return api
      .get(`/businesses/${id}`)
      .then((data) => setBusiness(data.business))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleGenerateCertificate(e) {
    e.preventDefault();
    setCertError("");
    setCertLoading(true);
    try {
      await api.post(`/businesses/${id}/certificates`, { destinationCountry });
      setDestinationCountry("");
      await loadBusiness();
    } catch (err) {
      setCertError(err.message);
    } finally {
      setCertLoading(false);
    }
  }

  async function handleUploadDocument(e) {
    e.preventDefault();
    setDocError("");
    if (!docFile) {
      setDocError("Choose a file first.");
      return;
    }
    setDocLoading(true);
    try {
      const formData = new FormData();
      formData.append("type", docType);
      formData.append("file", docFile);
      await api.post(`/businesses/${id}/documents`, formData);
      setDocFile(null);
      await loadBusiness();
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  }

  async function handleTogglePublic() {
    try {
      const data = await api.patch(`/businesses/${id}`, { isPublic: !business.isPublic });
      setBusiness((b) => ({ ...b, isPublic: data.business.isPublic }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteBusiness() {
    if (!window.confirm(`Delete "${business.name}"? This also removes its certificates and documents.`)) {
      return;
    }
    setError("");
    setDeletingBusiness(true);
    try {
      await api.delete(`/businesses/${id}`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setDeletingBusiness(false);
    }
  }

  async function handleDeleteDocument(doc) {
    if (!window.confirm(`Remove ${doc.originalName}?`)) return;
    setDocError("");
    setDeletingDocId(doc.id);
    try {
      await api.delete(`/documents/${doc.id}`);
      await loadBusiness();
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDeletingDocId(null);
    }
  }

  if (error) return <div className="error">{error}</div>;
  if (!business) return null;

  return (
    <>
      <div className="card">
        <div className="detail-heading">
          <h2>{business.name}</h2>
          <span className={`badge badge-${business.verificationStatus}`}>
            {VERIFICATION_LABELS[business.verificationStatus]}
          </span>
        </div>
        <p className="muted">
          {business.country} · {business.productCategory.replaceAll("_", " ")}
        </p>
        <p>{business.productDescription}</p>

        <div className="public-profile-box">
          <QRCodeSVG value={publicUrl} size={96} />
          <div>
            <p className="muted" style={{ margin: 0 }}>
              Public profile
            </p>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
            <div style={{ marginTop: 8 }}>
              <label className="inline-checkbox">
                <input type="checkbox" checked={business.isPublic} onChange={handleTogglePublic} />
                Listed publicly (visible via link / directory once verified)
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="icon-button-danger"
          style={{ marginTop: 16 }}
          disabled={deletingBusiness}
          onClick={handleDeleteBusiness}
        >
          {deletingBusiness ? "Deleting…" : "Delete this business"}
        </button>
      </div>

      <div className="card">
        <h2>Compliance documents</h2>
        <p className="muted">
          Upload your business registration certificate and TIN proof to get verified. An admin reviews
          each upload.
        </p>

        {docError && <div className="error">{docError}</div>}

        {business.documents.length > 0 && (
          <ul className="entity-list">
            {business.documents.map((d) => (
              <li key={d.id} className="entity-list-item">
                <div>
                  <strong>{DOC_TYPE_LABELS[d.type] || d.type}</strong>
                  <div className="muted">{d.originalName}</div>
                  {d.reviewNote && <div className="muted">Note: {d.reviewNote}</div>}
                </div>
                <div className="entity-list-actions">
                  <span className={`badge badge-doc-${d.status}`}>{d.status}</span>
                  {d.status !== "approved" && (
                    <button
                      type="button"
                      className="icon-button-danger"
                      disabled={deletingDocId === d.id}
                      onClick={() => handleDeleteDocument(d)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleUploadDocument} className="inline-form">
          <label>
            Document type
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            File (PDF, JPG, or PNG)
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
          </label>
          <button type="submit" disabled={docLoading}>
            {docLoading ? "Uploading…" : "Upload document"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Export-readiness checklist &amp; certificate</h2>

        {certError && <div className="error">{certError}</div>}

        <form onSubmit={handleGenerateCertificate} className="inline-form">
          <label>
            Destination country
            <select
              required
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
            >
              <option value="">Select a country</option>
              {AU_COUNTRIES.filter((c) => c !== business.country).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={certLoading}>
            {certLoading ? "Generating…" : "Generate checklist & draft certificate"}
          </button>
        </form>

        {business.certificates.length > 0 && (
          <ul className="entity-list">
            {business.certificates.map((cert) => (
              <li key={cert.id} className="entity-list-item">
                <div>
                  <strong>Export to {cert.destinationCountry}</strong>
                  <div className="muted">{new Date(cert.createdAt).toLocaleDateString()}</div>
                </div>
                <a className="button" href={`/api/certificates/${cert.id}/pdf`} target="_blank" rel="noreferrer">
                  Download PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/dashboard" className="muted">
        ← Back to dashboard
      </Link>
    </>
  );
}
