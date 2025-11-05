-- Delete June, July, and August data from the database
-- Adjust the year (2024) if needed for your specific case

-- WARNING: This will permanently delete data. Make sure to backup first!
-- Run this in a transaction so you can rollback if needed

BEGIN;

-- Step 1: Delete meetings created or booked in June, July, or August
-- Adjust the year (2024) if your test data is from a different year
DELETE FROM public.meetings
WHERE 
  -- Delete meetings created in June, July, or August
  (EXTRACT(YEAR FROM created_at) = 2024 AND EXTRACT(MONTH FROM created_at) IN (6, 7, 8))
  OR
  -- Also delete meetings booked in June, July, or August (if booked_at is different from created_at)
  (EXTRACT(YEAR FROM booked_at) = 2024 AND EXTRACT(MONTH FROM booked_at) IN (6, 7, 8));

-- Step 2: Delete assignments for June, July, and August
-- Adjust the year prefix ('2024') if your test data is from a different year
DELETE FROM public.assignments
WHERE month IN ('2024-06', '2024-07', '2024-08');

-- Step 3: Optionally delete clients created in June, July, or August
-- UNCOMMENT the following lines if you also want to delete test clients
-- WARNING: This will cascade delete any remaining meetings/assignments for these clients
-- DELETE FROM public.clients
-- WHERE EXTRACT(YEAR FROM created_at) = 2024 
--   AND EXTRACT(MONTH FROM created_at) IN (6, 7, 8);

-- Review the changes before committing
-- If everything looks good, run: COMMIT;
-- If you want to undo, run: ROLLBACK;

-- Preview what will be deleted (run these before the DELETE statements to see what will be affected):
-- SELECT COUNT(*) as meetings_to_delete FROM public.meetings
-- WHERE (EXTRACT(YEAR FROM created_at) = 2024 AND EXTRACT(MONTH FROM created_at) IN (6, 7, 8))
--    OR (EXTRACT(YEAR FROM booked_at) = 2024 AND EXTRACT(MONTH FROM booked_at) IN (6, 7, 8));
--
-- SELECT COUNT(*) as assignments_to_delete FROM public.assignments
-- WHERE month IN ('2024-06', '2024-07', '2024-08');
--
-- SELECT COUNT(*) as clients_to_delete FROM public.clients
-- WHERE EXTRACT(YEAR FROM created_at) = 2024 AND EXTRACT(MONTH FROM created_at) IN (6, 7, 8);

COMMIT;

