# Contributing to DB Visualizer

Thank you for your interest in contributing to DB Visualizer! 🎉

This document provides guidelines and instructions for contributing code, documentation, and feedback.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions. We're building an open, welcoming community.

## Ways to Contribute

### 🐛 Report Bugs
- Search [Issues](https://github.com/keerthisuryateja/DB-Visualizer/issues) first to avoid duplicates
- Create a detailed bug report with:
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots/video if applicable
  - Your OS, Node version, and app version

### 💡 Suggest Features
- Use [Issues](https://github.com/keerthisuryateja/DB-Visualizer/issues) with label `enhancement`
- Describe the use case and expected benefit
- Include mockups or examples if helpful

### 📖 Improve Documentation
- Fix typos or clarity issues in README, CONTRIBUTING, or code comments
- Add examples or troubleshooting guides
- Translate docs to other languages

### 💻 Contribute Code
- Fork the repository
- Create a feature branch
- Make focused changes
- Submit a pull request with clear description

## Getting Started

### Prerequisites

- **Node.js** 20+ and `npm`
- **Git** for version control
- **VS Code** (recommended but not required)
- Familiarity with React, TypeScript, and Electron

### Development Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/DB-Visualizer.git
cd DB-Visualizer/monkeydb-visualizer

# 3. Add upstream remote
git remote add upstream https://github.com/keerthisuryateja/DB-Visualizer.git

# 4. Install dependencies
npm install

# 5. Start development server
npm run dev:desktop

# 6. Verify build
npm run build
```

### Project Structure

```
src/
├── App.tsx                 # Core React component (~1400 lines)
│                          # All app logic, state, queries, analytics
├── App.css                # Complete styling system
│                          # Responsive grid, flexbox, adaptive design
├── main.tsx               # React entry point
└── vite-env.d.ts          # TypeScript Vite types

electron/
└── main.cjs               # Electron main process (window, IPC, file dialogs)

public/                    # Static assets (favicon, etc.)

Build Config:
├── vite.config.ts         # Vite bundler configuration
├── tsconfig.json          # TypeScript compiler options
├── package.json           # Dependencies + electron-builder config
└── index.html             # HTML template
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/bug-description
```

Use descriptive names:
- ✅ `feature/advanced-sql-parser`
- ✅ `fix/table-overflow-responsive`
- ✅ `docs/readme-installation-guide`
- ❌ `feature/update` (too vague)

### 2. Make Changes

- **Small commits**: Logical, focused changes with clear messages
  ```bash
  git commit -m "feat: add ORDER BY support to query engine"
  git commit -m "fix: prevent table column collapse on narrow screens"
  ```

- **Code style**: Follow existing patterns in codebase
  - Use TypeScript types explicitly
  - Add JSDoc comments for complex functions
  - Keep functions under 50 lines when possible

- **Testing**: Test your changes locally
  ```bash
  npm run build           # No TypeScript errors?
  npm run dev:desktop    # App launches and features work?
  ```

### 3. Keep Updated

Before submitting PR, sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
# or merge if you prefer
git merge upstream/main
```

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub with:
- **Clear title**: "Add ORDER BY support to SQL query engine"
- **Detailed description**: What problem does it solve? How does it work?
- **References**: Link related issues (`Fixes #123`, `Related to #456`)
- **Screenshots/GIF**: For UI changes
- **Testing notes**: How to verify the fix works

### Example PR Description

```markdown
## Description
Implements ORDER BY clause in SQL-like query engine for sorting results by column.

## Motivation
Users need ability to sort query results beyond the current ascending/descending toggle in Explorer table.

## Changes
- Extended query parser to recognize ORDER BY syntax
- Added sort direction validation (ASC/DESC)
- Updated executeSqlLikeQuery() to apply sorting
- Added tests for edge cases (multiple columns, invalid columns)

## Testing
- [x] Manual test: `SELECT * FROM data WHERE age > 25 ORDER BY name ASC LIMIT 50`
- [x] Tested with student dataset (607 rows)
- [x] Verified no regression in existing queries
- [x] Tested invalid column names (proper error handling)

## Screenshots
[Optional: Add screenshots before/after]

## Checklist
- [x] Code follows project style
- [x] No TypeScript errors
- [x] Updated relevant comments/docs
- [x] Tested in dev mode (`npm run dev:desktop`)
- [x] Build passes (`npm run build`)
```

## Code Standards

### TypeScript

```typescript
// ✅ Use explicit types
const dataset: DataSet = { rows: [], schema: [] };

// ✅ Use interfaces for complex objects
interface QueryResult {
  rows: DataRow[];
  executedAt: number;
  rowCount: number;
}

// ✅ Add JSDoc for public functions
/**
 * Parse CSV string with automatic delimiter detection
 * @param csvText - Raw CSV content
 * @returns Parsed rows and inferred schema
 * @throws Error if CSV is malformed
 */
function parseCsv(csvText: string): { rows: DataRow[]; schema: DataSchema[] } {
  // ...
}

// ❌ Avoid `any` type
const result: any = executeQuery();  // Bad!

// ✅ Prefer specific types
const result: QueryResult = executeQuery();  // Good!
```

### React Components

```typescript
// ✅ Use functional components with hooks
function ExplorerPage({ dataset }: { dataset: DataSet }) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  
  return (
    <div className="explorer">
      {/* UI */}
    </div>
  );
}

// ✅ Use semantic HTML
<button onClick={handleFilter}>Search</button>
<table>
  <thead><tr><th>Name</th></tr></thead>
  <tbody>{/* rows */}</tbody>
</table>

// ❌ Don't use inline object literals for props
<Component style={{ color: 'red', fontSize: '16px' }} />  // Bad performance

// ✅ Define styles in CSS
// In App.css:
.component { color: red; font-size: 16px; }
```

### CSS & Responsive Design

```css
/* ✅ Use CSS Grid for major layout */
.container {
  display: grid;
  grid-template-columns: clamp(240px, 21vw, 320px) minmax(0, 1fr);
  gap: 1rem;
}

/* ✅ Use clamp() for fluid sizing */
.heading {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
}

/* ✅ Mobile-first with media queries */
.item {
  display: block;  /* Mobile default */
}

@media (min-width: 1080px) {
  .item {
    display: grid;
  }
}

/* ✅ Document magic numbers */
.sidebar {
  /* Proportional to viewport, never narrower than 240px, never wider than 320px */
  width: clamp(240px, 21vw, 320px);
  overflow: hidden;  /* Strict containment to prevent child overflow */
}

/* ❌ Don't use hardcoded pixel values everywhere */
.item { width: 320px; }  /* Breaks responsiveness */

/* ❌ Don't forget ellipsis for truncated text */
.label {
  white-space: nowrap;
  overflow: hidden;
  /* Missing text-overflow! */
}

/* ✅ Complete text truncation */
.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature description
fix: resolve specific bug
docs: update README or docs
refactor: restructure code without changing behavior
perf: improve performance
chore: dependency updates, build changes
test: add or update tests
ci: workflow or CI configuration changes
```

Examples:
```bash
git commit -m "feat: implement GROUP BY in query engine"
git commit -m "fix: prevent table columns from collapsing on narrow screens"
git commit -m "docs: add architecture guide to README"
git commit -m "refactor: extract column filter logic into function"
git commit -m "perf: optimize duplicate detection algorithm"
git commit -m "chore: bump electron to 36.0.0"
```

## Testing

### Manual Testing

Before submitting PR:

```bash
# 1. Build production bundle
npm run build

# 2. Run dev server
npm run dev:desktop

# 3. Test your changes thoroughly:
#    - Import test CSV (use mock_student_data_comprehensive.csv)
#    - Test new feature with various inputs
#    - Verify no regressions in existing features
#    - Check responsive layout at different screen sizes
#    - Test on actual Electron desktop app window

# 4. Check for TypeScript errors
npm run build          # Should complete with no errors
```

### Edge Cases to Test

- Empty datasets (0 rows)
- Large datasets (500+ rows)
- Null/missing values in data
- Malformed CSV (missing quotes, wrong delimiters)
- Very long text values (truncation/ellipsis)
- Narrow screens (mobile/tablet)
- Rapid user interactions (filtering + sorting + pagination quickly)

## Performance Considerations

### Before Optimizing

- Profile first: use DevTools to identify actual bottleneck
- Don't optimize prematurely
- Measure improvements: before/after metrics

### Common Optimizations

```typescript
// ✅ Memoize expensive calculations
const memoizedResult = useMemo(() => {
  return expensiveDataProcessing(largeDataset);
}, [largeDataset]);

// ✅ Debounce rapid state updates
const debouncedFilter = useDeferredValue(filterInput);

// ✅ Paginate large lists
const visibleRows = dataset.rows.slice(pageStart, pageEnd);

// ❌ Don't over-optimize without metrics
// Avoid premature micro-optimizations
```

### Data Limits

Current tested limits:
- **Rows**: 607 (realistic test dataset)
- **Columns**: 30 (student data)
- **File Size**: ~200 KB CSV
- **Performance**: Sub-second load + query execution

## Documentation

### README Updates

If your feature affects user workflows, update [README.md](README.md):
- Add feature to Features section
- Update Data Limits if applicable
- Add script if new npm command
- Document new query syntax if applicable
- Add troubleshooting entry if known issues

### Code Comments

```typescript
// ✅ Explain WHY, not WHAT (code should be clear enough for WHAT)
// We filter by timestamp first because the dataset might have
// records from multiple days, and we only want today's data
const todayRecords = data.filter(r => 
  new Date(r.timestamp).toDateString() === new Date().toDateString()
);

// ❌ Obvious what code does, but not why
// Filter records by timestamp
const data2 = data.filter(r => r.timestamp > someDate);
```

### JSDoc for Public APIs

```typescript
/**
 * Execute a SQL-like query against the dataset
 * 
 * @param query - SQL string in format "SELECT cols FROM data WHERE condition LIMIT n"
 * @param dataset - The data to query
 * @param schema - Column metadata for type-safe filtering
 * @returns QueryResult with rows matching the condition
 * @throws Error if query syntax is invalid
 * 
 * @example
 * const result = executeSqlLikeQuery(
 *   "SELECT name, email FROM data WHERE age > 25 LIMIT 100",
 *   dataset,
 *   schema
 * );
 */
export function executeSqlLikeQuery(
  query: string,
  dataset: DataSet,
  schema: DataSchema[]
): QueryResult {
  // ...
}
```

## Feedback Process

### Responding to Review Comments

- **Be respectful**: Reviewers help improve the code
- **Ask for clarification**: If a comment is unclear, ask questions
- **Explain your reasoning**: If you disagree, explain why
- **Make requested changes**: Update your PR based on feedback
- **Request re-review**: Comment `@reviewer ready for re-review` after updates

### My Role as Maintainer

- I'll review PRs within 3-7 days (volunteer-run project)
- I may request changes or ask questions
- I'll merge when ready
- I'll credit contributors in release notes and CHANGELOG

## Release Process

When maintainer is ready to release:

1. Update `version` in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `chore: bump version to X.Y.Z`
4. Create tag: `git tag vX.Y.Z`
5. Push tag: `git push origin vX.Y.Z`
6. GitHub Actions creates release with installer

Contributors will be credited in the release notes! 🌟

## Getting Help

- **Documentation**: Check [README.md](README.md) and [wiki](https://github.com/keerthisuryateja/DB-Visualizer/wiki)
- **Issues**: Search existing [Issues](https://github.com/keerthisuryateja/DB-Visualizer/issues)
- **Discussions**: Ask in [GitHub Discussions](https://github.com/keerthisuryateja/DB-Visualizer/discussions)
- **Code examples**: Study existing code in `src/App.tsx` and `src/App.css`

## Recognition

All contributors are recognized in:
- CHANGELOG.md release notes (`Thanks to @contributor`)
- GitHub contributors graph
- Project README Credits section (for significant contributions)

---

Thank you for contributing to DB Visualizer! 🚀

Let's build something great together! 💪
