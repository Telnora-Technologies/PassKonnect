import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();

function publicBusinessFields(business) {
  return {
    id: business.id,
    name: business.name,
    country: business.country,
    productCategory: business.productCategory,
    productDescription: business.productDescription,
    verificationStatus: business.verificationStatus,
    createdAt: business.createdAt,
  };
}

router.get(
  "/businesses/:id",
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!business || !business.isPublic) {
      return res.status(404).json({ error: "Profile not found or not public." });
    }
    res.json({ business: publicBusinessFields(business) });
  })
);

router.get(
  "/directory",
  asyncHandler(async (req, res) => {
    const { country, category, q } = req.query;

    const where = {
      isPublic: true,
      verificationStatus: "verified",
      ...(country ? { country: String(country) } : {}),
      ...(category ? { productCategory: String(category) } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: String(q), mode: "insensitive" } },
              { productDescription: { contains: String(q), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.json({ businesses: businesses.map(publicBusinessFields) });
  })
);

export default router;
