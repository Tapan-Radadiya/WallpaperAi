DO $$
BEGIN
    -- preview_url
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attrdef d
        JOIN pg_class c ON c.oid = d.adrelid
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
        WHERE c.relname = 'tbl_image'
          AND a.attname = 'preview_url'
    ) THEN
        ALTER TABLE "tbl_image"
        ALTER COLUMN "preview_url" SET DEFAULT '';
    END IF;

    -- waterMarked_url
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attrdef d
        JOIN pg_class c ON c.oid = d.adrelid
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
        WHERE c.relname = 'tbl_image'
          AND a.attname = 'waterMarked_url'
    ) THEN
        ALTER TABLE "tbl_image"
        ALTER COLUMN "waterMarked_url" SET DEFAULT '';
    END IF;
END $$;