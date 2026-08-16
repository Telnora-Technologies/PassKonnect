import multer from "multer";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const EXT_BY_MIME = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

// Buffers land in req.file.buffer instead of on disk — the route handler
// hands the buffer to the blobStorage abstraction (lib/blobStorage.js),
// which is what actually decides where bytes end up (local disk in dev,
// Netlify Blobs in production).
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, and PNG files are allowed."));
    }
    cb(null, true);
  },
});
