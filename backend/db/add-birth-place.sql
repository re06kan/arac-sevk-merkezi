ALTER TABLE drivers
ADD COLUMN birth_place VARCHAR(25);

-- Update existing records to have a default value
UPDATE drivers
SET birth_place = 'BİLİNMİYOR'
WHERE birth_place IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE drivers
ALTER COLUMN birth_place SET NOT NULL;