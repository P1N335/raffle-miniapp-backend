-- Improve withdrawal/admin status filtering on case openings.
CREATE INDEX "CaseOpening_status_withdrawalRequestedAt_idx"
ON "CaseOpening"("status", "withdrawalRequestedAt");
