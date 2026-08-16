// Wraps an async Express handler/middleware so a rejected promise is forwarded
// to next(err) instead of becoming an unhandled rejection that crashes the
// process (Node terminates on unhandled rejections by default).
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
