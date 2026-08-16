import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { AU_COUNTRIES } from "../lib/constants";

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

export default function NewBusiness() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/categories")
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const updateProfile = (field) => (e) => setProfile((p) => ({ ...p, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/businesses", profile);
      navigate(`/businesses/${data.business.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Tell us about your business</h2>
      {error && <div className="error">{error}</div>}

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
        <select required value={profile.productCategory} onChange={updateProfile("productCategory")}>
          <option value="">Select a category</option>
          {(categories.length ? categories : ["general_merchandise"]).map((c) => (
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
  );
}
