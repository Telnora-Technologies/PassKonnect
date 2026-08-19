# Changelog

Notable changes to PassKonnect, by release. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Server Dockerfile and an optional `app` service in `docker-compose.yml`
  for running the API in a container against the local Postgres service.
- `CONTRIBUTING.md` with local checks and commit conventions.

### Changed

- CI's `npm audit` step now blocks the build on high-severity findings
  instead of only reporting them.

## [v0.1.0] - 2026-08-19

Initial public release: MSME onboarding, document upload and admin
verification, QR-linked public profiles, an MSME directory, AfCFTA
Certificate of Origin PDF generation, Postgres persistence via Prisma,
and deployment to Netlify (static client + serverless API + Netlify
Blobs for file storage).
