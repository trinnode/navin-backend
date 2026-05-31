# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed
- Double-hashing bug: removed the `UserSchema.pre('save')` password hook that caused `bcrypt` to hash an already-hashed value during signup, making all post-signup logins fail (#48)
- `acceptInvitation` now hashes the raw password in the service layer before `UserModel.create()`, consistent with all other flows (#48)

### Security
- `createTeamMember` no longer stores an empty string as `passwordHash`; a cryptographically random bcrypt hash is stored instead, ensuring `bcrypt.compare(anyInput, placeholder)` always returns `false` until the user completes the invitation flow (#48)

### Changed
- Password hashing is now exclusively the responsibility of the service layer (`auth.service.ts`, `users.service.ts`). The `UserSchema` pre-save hook has been removed to enforce a single hashing strategy (#48)
- Removed `bcrypt` import from `users.model.ts` (no longer needed) (#48)

### Tests
- Added `tests/password-hashing.test.ts` covering signup, invitation acceptance, team member creation, and login round-trip scenarios (#48)
