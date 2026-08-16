import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getBlob } from "../lib/blobStorage.js";

const router = Router();

// Download a generated certificate PDF (owner or admin only).
router.get(
  "/:id/pdf",
  requireAuth,
  asyncHandler(async (req, res) => {
    const certificate = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!certificate || !certificate.pdfPath) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    const business = await prisma.business.findUnique({ where: { id: certificate.businessId } });
    if (!business || (business.ownerId !== req.user.id && !req.user.isAdmin)) {
      return res.status(403).json({ error: "You do not have access to this certificate." });
    }

    const buffer = await getBlob(certificate.pdfPath);
    if (!buffer) return res.status(404).json({ error: "Certificate PDF not found." });

    res.setHeader("Content-Disposition", `attachment; filename="PassKonnect-Certificate-${certificate.id}.pdf"`);
    res.type("application/pdf").send(buffer);
  })
);

export default router;
