-- ============================================================
-- MIGRATION: Fix CART_MAPPINGS ProductID schema
-- ============================================================
-- Problem: ProductID was INT but Best Buy API uses string SKUs
-- Solution: Change ProductID to VARCHAR(50) to support string SKUs
-- ============================================================

-- Step 1: Drop the old table (backup your data first if needed!)
ALTER TABLE CART_MAPPINGS DROP PRIMARY KEY;
ALTER TABLE CART_MAPPINGS MODIFY ProductID VARCHAR(50) NOT NULL;
ALTER TABLE CART_MAPPINGS ADD PRIMARY KEY (MappingID);

-- Step 2: Verify the change
DESCRIBE CART_MAPPINGS;

-- Expected output:
-- MappingID       int             NO      PRI     
-- DriverID        int             NO              
-- ProductID       varchar(50)     NO              

