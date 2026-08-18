import { app } from "./app.js";
import { logger } from "./lib/logger.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`PassKonnect server listening on http://localhost:${PORT}`);
});
