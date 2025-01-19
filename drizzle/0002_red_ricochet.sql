ALTER TABLE "document" ADD COLUMN "embedding" vector(1024);--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "embedding_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "embedding_needs_update" boolean DEFAULT false NOT NULL;