CREATE TABLE "auth_rate_limits" (
    "bucket_key" VARCHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL,
    "window_started_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("bucket_key")
);

CREATE INDEX "auth_rate_limits_window_started_at_idx"
ON "auth_rate_limits"("window_started_at");
