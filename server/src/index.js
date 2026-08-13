import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { getDb } from "./db.js";
import { generateChecklist, KNOWN_CATEGORIES } from "./checklist.js";
import { generateCertificatePdf } from "./certificate.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "passkonnect-server" });
});

// Reference data the onboarding form can render (product categories)
app.get("/api/categories", (_req, res) => {
  res.json({ categories: KNOWN_CATEGORIES });
});

// Step 1: create a business profile
app.post("/api/businesses", async (req, res) => {
  const {
    name,
    country,
    productCategory,
    productDescription,
    inputsOrigin,
    registrationNumber,
    registrationCountry,
    contactEmail,
    contactPhone,
  } = req.body;

  if (!name || !country || !productCategory || !productDescription || !inputsOrigin || !contactEmail) {
    return res.status(400).json({
      error:
        "Missing required fields. Required: name, country, productCategory, productDescription, inputsOrigin, contactEmail.",
    });
  }

  const db = await getDb();
  const business = {
    id: uuidv4(),
    name,
    country,
    productCategory,
    productDescription,
    inputsOrigin,
    registrationNumber: registrationNumber || null,
    registrationCountry: registrationCountry || null,
    contactEmail,
    contactPhone: contactPhone || null,
    createdAt: new Date().toISOString(),
  };
  db.data.businesses.push(business);
  await db.write();

  res.status(201).json({ business });
});

app.get("/api/businesses/:id", async (req, res) => {
  const db = await getDb();
  const business = db.data.businesses.find((b) => b.id === req.params.id);
  if (!business) return res.status(404).json({ error: "Business not found." });

  const certificates = db.data.certificates.filter((c) => c.businessId === business.id);
  res.json({ business: { ...business, certificates } });
});

// Step 2: generate the export-readiness checklist + draft Certificate of Origin
app.post("/api/businesses/:id/certificates", async (req, res) => {
  const { destinationCountry } = req.body;
  if (!destinationCountry) {
    return res.status(400).json({ error: "destinationCountry is required." });
  }

  const db = await getDb();
  const business = db.data.businesses.find((b) => b.id === req.params.id);
  if (!business) return res.status(404).json({ error: "Business not found." });

  const checklist = generateChecklist({
    productCategory: business.productCategory,
    destinationCountry,
  });

  const certificateId = uuidv4();
  const pdfPath = await generateCertificatePdf({ certificateId, business, destinationCountry });

  const certificate = {
    id: certificateId,
    businessId: business.id,
    destinationCountry,
    status: "draft",
    checklist,
    pdfPath,
    createdAt: new Date().toISOString(),
  };
  db.data.certificates.push(certificate);
  await db.write();

  res.status(201).json({ certificate });
});

// Download the generated PDF
app.get("/api/certificates/:id/pdf", async (req, res) => {
  const db = await getDb();
  const certificate = db.data.certificates.find((c) => c.id === req.params.id);
  if (!certificate || !certificate.pdfPath) {
    return res.status(404).json({ error: "Certificate not found." });
  }
  res.download(path.resolve(certificate.pdfPath), `PassKonnect-Certificate-${certificate.id}.pdf`);
});

app.listen(PORT, () => {
  console.log(`PassKonnect server listening on http://localhost:${PORT}`);
});
