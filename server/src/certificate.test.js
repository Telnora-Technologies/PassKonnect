import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./lib/blobStorage.js", () => ({
  putBlob: vi.fn().mockResolvedValue(undefined),
}));

const { generateCertificatePdf, certificateBlobKey } = await import("./certificate.js");
const { putBlob } = await import("./lib/blobStorage.js");

const business = {
  id: "biz-1",
  name: "Acme Textiles",
  country: "Nigeria",
  registrationNumber: null,
  contactEmail: "acme@example.com",
  contactPhone: null,
  productCategory: "textiles_and_fashion",
  productDescription: "Handmade bags",
  inputsOrigin: "Local leather",
  verificationStatus: "verified",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateCertificatePdf", () => {
  it("returns a blob key matching the certificate id", async () => {
    const key = await generateCertificatePdf({
      certificateId: "cert-1",
      business,
      destinationCountry: "Ghana",
    });

    expect(key).toBe(certificateBlobKey("cert-1"));
    expect(key).toBe("certificates/cert-1.pdf");
  });

  it("stores a valid PDF buffer under that key", async () => {
    await generateCertificatePdf({ certificateId: "cert-2", business, destinationCountry: "Kenya" });

    expect(putBlob).toHaveBeenCalledTimes(1);
    const [key, buffer, contentType] = putBlob.mock.calls[0];

    expect(key).toBe("certificates/cert-2.pdf");
    expect(contentType).toBe("application/pdf");
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("works for a business with no verification yet (QR still resolves)", async () => {
    const unverified = { ...business, verificationStatus: "unverified" };
    await expect(
      generateCertificatePdf({ certificateId: "cert-3", business: unverified, destinationCountry: "Ghana" })
    ).resolves.toBe("certificates/cert-3.pdf");
  });
});
