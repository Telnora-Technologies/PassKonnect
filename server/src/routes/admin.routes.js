import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { recomputeVerificationStatus } from "../lib/verification.js";

const router = Router();

router.use(requireAdmin);

router.get(
  "/documents",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const where = status === "all" ? {} : { status };

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: { business: { include: { owner: true } } },
    });

    res.json({
      documents: documents.map((d) => ({
        id: d.id,
        type: d.type,
        originalName: d.originalName,
        status: d.status,
        reviewNote: d.reviewNote,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
        business: { id: d.business.id, name: d.business.name, ownerEmail: d.business.owner.email },
      })),
    });
  })
);

router.post(
  "/documents/:id/review",
  asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'." });
    }

    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: "Document not found." });

    await prisma.document.update({
      where: { id: document.id },
      data: {
        status,
        reviewNote: note || null,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
    });

    const verificationStatus = await recomputeVerificationStatus(document.businessId);

    req.log.info(
      {
        event: "document.reviewed",
        documentId: document.id,
        businessId: document.businessId,
        status,
        actorEmail: req.user.email,
        verificationStatus,
      },
      `Document ${status} by ${req.user.email}`
    );

    res.json({ ok: true, verificationStatus });
  })
);

router.get(
  "/audit-log",
  asyncHandler(async (_req, res) => {
    const entries = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    res.json({ entries });
  })
);

export default router;
