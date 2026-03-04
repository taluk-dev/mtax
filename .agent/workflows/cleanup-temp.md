---
description: Clean up temporary files and scripts created during the session or task.
---

This workflow is used to clean up any leftover temporary files (Python scripts, test scripts, etc.) in the working directories at the end of tasks.

1. Check the `backend/` directory. If there are temporary Python execution scripts such as `apply_db.py`, `migrate_tax_data.py`, or `rebuild_fk.py`, delete them using the `Remove-Item` command via `run_command`.
2. Check the `frontend/` directory or other project root directories for any temporary logs.
3. Delete any temporary task files created during the session that are no longer needed.
4. Notify the user once the environment cleanup is verified.
