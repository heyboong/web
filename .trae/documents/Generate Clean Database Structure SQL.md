I will generate a streamlined, "clean" version of the database file (`database_clean.sql`) by removing all comments, headers, and instructional text, keeping only the essential SQL commands required for the system to operate.

**Steps:**
1.  **Remove Comments:** Strip all lines starting with `--` (headers, table descriptions).
2.  **Retain Core Structure:** Keep all `CREATE TABLE`, `ALTER TABLE` (keys/indexes), and `CONSTRAINT` statements.
3.  **Retain Essential Data:** Keep `INSERT` statements strictly needed for the system to run (Admin user, Site Settings, Languages).
4.  **Format:** Output the pure SQL code ready for import.

This will provide you with a compact file containing only the "main operating structure" as requested.