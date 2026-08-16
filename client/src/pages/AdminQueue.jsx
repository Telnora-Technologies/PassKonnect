import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AdminQueue() {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const [auditLog, setAuditLog] = useState(null);
  const [auditError, setAuditError] = useState("");

  function loadQueue() {
    return api
      .get("/admin/documents?status=pending")
      .then((data) => setDocuments(data.documents))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadQueue();
    api
      .get("/admin/audit-log")
      .then((data) => setAuditLog(data.entries))
      .catch((err) => setAuditError(err.message));
  }, []);

  async function handleReview(id, status) {
    setBusyId(id);
    setError("");
    try {
      await api.post(`/admin/documents/${id}/review`, { status, note: notes[id] || "" });
      await loadQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Document review queue</h2>
        {error && <div className="error">{error}</div>}

        {documents && documents.length === 0 && <p className="muted">Nothing pending review.</p>}

        {documents && documents.length > 0 && (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Type</th>
                  <th>File</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.business.name}</strong>
                      <div className="muted">{d.business.ownerEmail}</div>
                    </td>
                    <td>{d.type.replaceAll("_", " ")}</td>
                    <td>
                      <a href={`/api/documents/${d.id}/file`} target="_blank" rel="noreferrer">
                        {d.originalName}
                      </a>
                    </td>
                    <td>
                      <input
                        placeholder="Optional note"
                        value={notes[d.id] || ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                      />
                    </td>
                    <td className="admin-actions">
                      <button
                        type="button"
                        disabled={busyId === d.id}
                        onClick={() => handleReview(d.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={busyId === d.id}
                        onClick={() => handleReview(d.id, "rejected")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Audit log</h2>
        <p className="muted">
          A record of verified businesses removed by their owner — verification review still happened even
          though the profile is gone.
        </p>
        {auditError && <div className="error">{auditError}</div>}

        {auditLog && auditLog.length === 0 && <p className="muted">No entries yet.</p>}

        {auditLog && auditLog.length > 0 && (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Performed by</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{entry.action.replaceAll(".", " ")}</td>
                    <td>{entry.businessName}</td>
                    <td>{entry.ownerEmail}</td>
                    <td>{entry.performedByEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
