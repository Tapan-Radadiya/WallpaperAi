DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tbl_image'
          AND column_name = 'title'
          AND column_default IS NULL
    ) THEN
        ALTER TABLE "tbl_image"
        ALTER COLUMN "title" SET DEFAULT 'unknown';
    END IF;
END $$;
