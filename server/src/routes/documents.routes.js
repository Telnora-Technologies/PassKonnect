import { Router } from "express";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { uploadDocument, EXT_BY_MIME } from "../lib/upload.js";
import { putBlob, getBlob, deleteBlob } from "../lib/blobStorage.js";
import { recomputeVerificationStatus, DOCUMENT_TYPES } from "../lib/verification.js";
import { writeLimiter } from "../lib/rateLimit.js";

const router = Router();

router.get("/document-types", (_req, res) => {
  res.json({ types: DOCUMENT_TYPES });
});

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

router.post(
  "/businesses/:id/documents",
  requireAuth,
  writeLimiter,
  uploadDocument.single("file"),
  asyncHandler(async (req, res) => {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const validTypes = DOCUMENT_TYPES.map((t) => t.value);
    const { type } = req.body;
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
    }
    if (!req.file) {
      return res.status(400).json({ error: "A file is required." });
    }

    const key = `documents/${business.id}/${uuidv4()}${EXT_BY_MIME[req.file.mimetype] || ""}`;
    await putBlob(key, req.file.buffer, req.file.mimetype);

    const document = await prisma.document.create({
      data: {
        businessId: business.id,
        type,
        originalName: req.file.originalname,
        filePath: key,
      },
    });

    await recomputeVerificationStatus(business.id);

    res.status(201).json({ document });
  })
);

router.get(
  "/businesses/:id/documents",
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const documents = await prisma.document.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ documents });
  })
);

// Owners can remove a document as long as it hasn't been approved yet
// (approved documents are part of the verification record and stay put).
router.delete(
  "/documents/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: "Document not found." });

    const business = await prisma.business.findUnique({ where: { id: document.businessId } });
    if (!business || (business.ownerId !== req.user.id && !req.user.isAdmin)) {
      return res.status(403).json({ error: "You do not have access to this document." });
    }
    if (document.status === "approved" && !req.user.isAdmin) {
      return res.status(409).json({ error: "Approved documents can't be removed by the owner." });
    }

    await prisma.document.delete({ where: { id: document.id } });
    await deleteBlob(document.filePath);
    await recomputeVerificationStatus(business.id);

    res.json({ ok: true });
  })
);

router.get(
  "/documents/:id/file",
  requireAuth,
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: "Document not found." });

    const business = await prisma.business.findUnique({ where: { id: document.businessId } });
    if (!business || (business.ownerId !== req.user.id && !req.user.isAdmin)) {
      return res.status(403).json({ error: "You do not have access to this document." });
    }

    const buffer = await getBlob(document.filePath);
    if (!buffer) return res.status(404).json({ error: "File not found." });

    res.setHeader("Content-Disposition", `inline; filename="${document.originalName}"`);
    // res.type() treats any string containing "/" as a literal Content-Type
    // value rather than a filename to derive one from — blob keys like
    // "documents/<id>/<uuid>.pdf" contain slashes, so pass just the
    // extension (Express looks that up via the mime-types table).
    res.type(path.extname(document.filePath)).send(buffer);
  })
);

export default router;
