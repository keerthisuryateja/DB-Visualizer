# Changelog

All notable changes to DB Visualizer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.1.0] - 2026-04-13

### Initial Release

#### Added
- **Core Data Import**: CSV and JSON file import with automatic delimiter detection
- **Interactive Explorer**: Full-text search, sorting, pagination, and filtering across datasets
- **SQL-like Query Engine**: SELECT WHERE LIMIT queries with column filtering and conditions
- **Data Profiling**: Automatic type inference (string, number, boolean, datetime, mixed)
- **Duplicate Detection**: Built-in duplicate row counting and identification
- **Export to CSV**: Download filtered or queried results back to CSV format
- **Responsive Design**: Adaptive layout using CSS Grid with `clamp()` for all screen sizes (1680px down to mobile)
- **Persistent Workspace**: Automatic localStorage persistence for datasets, queries, and preferences
- **Interaction Heatmap**: Real-time tracking of 12+ user actions with visual analytics
  - Tracked actions: import, export, filter, sort, paginate, query, normalize nulls, remove duplicates, etc.
- **Professional UI**: IBM Plex Sans (body), Sora (headings), JetBrains Mono (code)
- **Playful Aesthetics**: Kid-friendly but professional design language with primary color #685500
- **Desktop App**: Electron 36 wrapper with native window, file dialogs, and system tray integration
- **Hub Dashboard**: Stats cards with active dataset summary and navigation
- **Command Console**: SQL query history with replay and result export
- **Analytics Panel**: Data quality metrics + visual interaction heatmap
- **Import History**: Track all file imports with timestamps and status

#### Technical
- **Frontend**: React 19 + TypeScript with full type safety
- **Build**: Vite 7 bundler with TypeScript compilation
- **Desktop**: Electron 36 with Electron Builder (Windows NSIS packaging)
- **State Management**: React hooks + localStorage with versioned storage keys
- **Styling**: CSS Grid + Flexbox with responsive `clamp()` functions
- **Data Processing**: In-memory CSV/JSON parser with null normalization and type inference

#### Data Features
- **Dataset Size**: Tested with 607 rows × 30 columns (realistic edge cases included)
- **Data Quality**: Handles nulls, duplicates, mixed types, and malformed values gracefully
- **Column Types**: Automatic inference for string, number, boolean, datetime, and mixed types
- **Query Filtering**: Fast in-memory WHERE clause evaluation with AND/OR logic

#### Documentation
- Comprehensive README with feature overview, installation, and usage guide
- CONTRIBUTING.md for development workflow
- CHANGELOG.md (this file) for version history tracking

#### CI/CD
- GitHub Actions workflow for automated testing on PR/push
- Desktop app build automation for Windows NSIS installer
- Automated release workflow on git tag creation
- Build artifacts stored in GitHub Actions for 90 days

### Known Limitations
- No GROUP BY, DISTINCT, or ORDER BY in query engine yet
- No JOIN operations between multiple tables
- Desktop app currently builds for Windows only (macOS/Linux planned)
- In-memory data processing (no streaming for very large files)
- Query filtering case-insensitive by design

### Future Considerations
- Multi-table support with dataset tabs
- Advanced SQL parser (ORDER BY, GROUP BY, COUNT, SUM, AVG)
- Dark mode theme toggle
- Column visibility picker
- Keyboard shortcuts reference
- Unit and E2E test suite
- Accessibility audit (WCAG 2.1)
- Performance optimization for 10k+ row datasets

---

## Release Notes Format

For future releases, include:

### [X.Y.Z] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Modifications to existing features

#### Fixed
- Bug fixes

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Security
- Security fixes

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, major features
- **MINOR** (0.Y.0): New features, backward compatible
- **PATCH** (0.0.Z): Bug fixes, backward compatible

---

## Release Checklist

Before creating a new release:

1. ✅ Update `version` in `package.json`
2. ✅ Update `CHANGELOG.md` with new section
3. ✅ Commit changes with message: `chore: bump version to X.Y.Z`
4. ✅ Create git tag: `git tag vX.Y.Z`
5. ✅ Push tag: `git push origin vX.Y.Z`
6. ✅ GitHub Actions automatically creates release
7. ✅ Verify installer in GitHub Release

---

Generated: 2026-04-13
