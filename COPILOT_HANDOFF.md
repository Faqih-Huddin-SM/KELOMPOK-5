# Copilot handoff

## Why this note exists

The project is being moved from `C:\xampp\htdocs\KELOMPOK-5` to
`D:\laragon\www\KELOMPOK-5`. This is a context handoff for continuing work in
Copilot from the Laragon workspace; it is not an export of the chat transcript.

## Current conversation

- The user asked to carry project/conversation context into the new workspace.
- The project has no application chat/messages feature or chat tables.
- This session's available context is limited to this migration request. Older
  Copilot conversation history is not included in this file.

## Project and migration facts

- Project: Kataji Barber, built with PHP and MySQL.
- Database schema: `database/schema.sql`; database name: `kataji_barber`.
- Local DB connection settings are in `config/config.php`; check the Laragon
  MySQL credentials before using the app. Do not copy real credentials into
  Git.
- Preserve `uploads/`, `assets/uploads/`, and local configuration as applicable.
- Both source and destination repositories have local uncommitted changes.
  Inspect each `git status` and merge deliberately; do not overwrite either
  workspace wholesale.
- `MIGRATION_CONTEXT.md` already exists in both workspaces and describes project
  work and Laragon setup. The two copies differ, so review/merge them rather
  than replacing one blindly.

## Start the next Copilot session

Open `D:\laragon\www\KELOMPOK-5`, read this file and `MIGRATION_CONTEXT.md`,
then inspect `git status` before making changes. Continue with the user's next
requested task; no implementation task is pending from this migration request.
