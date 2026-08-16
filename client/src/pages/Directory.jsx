import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { AU_COUNTRIES } from "../lib/constants";

export default function Directory() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (category) params.set("category", category);
    if (q) params.set("q", q);

    api
      .get(`/public/directory?${params.toString()}`)
      .then((data) => setBusinesses(data.businesses))
      .catch((err) => setError(err.message));
  }, [country, category, q]);

  return (
    <div className="card">
      <h2>Verified MSME directory</h2>
      <p className="muted">Browse AfCFTA-ready, verified African businesses.</p>

      {error && <div className="error">{error}</div>}

      <div className="inline-form">
        <label>
          Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Business name or product" />
        </label>
        <label>
          Country
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {AU_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
      </div>

      {businesses.length === 0 && <p className="muted">No verified businesses match yet.</p>}

      <div className="directory-grid">
        {businesses.map((b) => (
          <Link to={`/p/${b.id}`} key={b.id} className="directory-card">
            <strong>{b.name}</strong>
            <span className="muted">
              {b.country} · {b.productCategory.replaceAll("_", " ")}
            </span>
            <p>{b.productDescription}</p>
            <span className="badge badge-verified">Verified</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
