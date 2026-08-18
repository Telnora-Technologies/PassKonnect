import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { writeLimiter } from "../lib/rateLimit.js";
import { generateChecklist } from "../checklist.js";
import { generateCertificatePdf } from "../certificate.js";
import { deleteBlob } from "../lib/blobStorage.js";
import { createBusinessSchema } from "../schemas/business.schema.js";

const router = Router();

function serializeBusiness(business) {
  return { ...business, documents: undefined };
}

async function loadOwnedBusiness(req, res) {
  const business = await prisma.business.findUnique({ where: { id: req.params.id } });
  if (!business) {
    res.status(404).json({ error: "Business not found." });
    return null;
  }
  if (business.ownerId !== req.user.id && !req.user.isAdmin) {
    res.status(403).json({ error: "You do not have access to this business." });
    return null;
  }
  return business;
}

// Create a business profile, owned by the authenticated user.
router.post(
  "/",
  requireAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const parsed = createBusinessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

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
    } = parsed.data;

    const business = await prisma.business.create({
      data: {
        ownerId: req.user.id,
        name,
        country,
        productCategory,
        productDescription,
        inputsOrigin,
        registrationNumber: registrationNumber || null,
        registrationCountry: registrationCountry || null,
        contactEmail,
        contactPhone: contactPhone || null,
      },
    });

    res.status(201).json({ business: serializeBusiness(business) });
  })
);

// List the authenticated user's own businesses.
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const businesses = await prisma.business.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ businesses: businesses.map(serializeBusiness) });
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const [certificates, documents] = await Promise.all([
      prisma.certificate.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } }),
      prisma.document.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } }),
    ]);

    res.json({
      business: {
        ...serializeBusiness(business),
        certificates: certificates.map((c) => ({ ...c, checklist: JSON.parse(c.checklist) })),
        documents,
      },
    });
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const { isPublic } = req.body;
    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ error: "isPublic (boolean) is required." });
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { isPublic },
    });

    res.json({ business: serializeBusiness(updated) });
  })
);

// Delete a business and everything under it (certificates, documents, and
// their files on disk). Owner or admin only.
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const [certificates, documents] = await Promise.all([
      prisma.certificate.findMany({ where: { businessId: business.id } }),
      prisma.document.findMany({ where: { businessId: business.id } }),
    ]);

    await Promise.all([
      ...certificates.filter((c) => c.pdfPath).map((c) => deleteBlob(c.pdfPath)),
      ...documents.map((d) => deleteBlob(d.filePath)),
    ]);

    // Verified businesses have been through admin review — keep a record
    // that verification happened even after the owner removes the profile,
    // so there's still an audit trail if the fact of past verification is
    // ever in question.
    if (business.verificationStatus === "verified") {
      const owner = await prisma.user.findUnique({ where: { id: business.ownerId } });
      await prisma.auditLog.create({
        data: {
          action: "business.deleted",
          businessId: business.id,
          businessName: business.name,
          ownerEmail: owner?.email || business.contactEmail,
          verificationStatus: business.verificationStatus,
          performedByEmail: req.user.email,
        },
      });
    }

    await prisma.$transaction([
      prisma.document.deleteMany({ where: { businessId: business.id } }),
      prisma.certificate.deleteMany({ where: { businessId: business.id } }),
      prisma.business.delete({ where: { id: business.id } }),
    ]);

    res.json({ ok: true });
  })
);

// Generate the export-readiness checklist + draft Certificate of Origin.
router.post(
  "/:id/certificates",
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const { destinationCountry } = req.body;
    if (!destinationCountry) {
      return res.status(400).json({ error: "destinationCountry is required." });
    }

    const checklist = generateChecklist({
      productCategory: business.productCategory,
      destinationCountry,
    });

    const certificate = await prisma.certificate.create({
      data: {
        businessId: business.id,
        destinationCountry,
        checklist: JSON.stringify(checklist),
      },
    });

    const pdfPath = await generateCertificatePdf({
      certificateId: certificate.id,
      business,
      destinationCountry,
    });

    const updated = await prisma.certificate.update({
      where: { id: certificate.id },
      data: { pdfPath },
    });

    res.status(201).json({ certificate: { ...updated, checklist } });
  })
);

export default router;
