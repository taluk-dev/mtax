---
description: Update the CHANGELOG.md file at the end of a session or when significant changes (schema, new features, bug fixes, etc.) have been made.
---

This workflow should be used by the agent to document new features and changes inside the root `CHANGELOG.md` file during or at the end of a session.

1. Read the `CHANGELOG.md` file located in the project's root directory using the `view_file` tool.
2. Review all notable changes made throughout the session.
3. Categorize the changes in accordance with the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standard:
   - `Added` (For new features)
   - `Changed` (For changes in existing functionality)
   - `Deprecated` (For soon-to-be removed features)
   - `Removed` (For now removed features)
   - `Fixed` (For any bug fixes)
   - `Security` (In case of vulnerabilities)
4. Permanently update the file's content under the appropriate category headers (e.g., `### Added` or `### Changed`) using the current session's version and date format (e.g., `## [2.1.0] - YYYY-MM-DD`) instead of using an `[Unreleased]` section. Ensure that duplicate headers are merged if updating the same version.
