# DB Visualizer 📊

A professional desktop application for exploring, querying, and analyzing CSV/JSON datasets with an interactive, kid-friendly interface.

## Features

✨ **Core Capabilities**
- 📁 Import CSV and JSON data files
- 🔍 Full-text search and filtering across your dataset
- 📊 Interactive data exploration with pagination and sorting
- 💾 Export filtered results back to CSV
- 🎯 SQL-like query engine (SELECT WHERE LIMIT)
- 📈 Data profiling with type inference and duplicate detection
- 💾 Automatic workspace persistence via localStorage
- 📱 Responsive design that adapts from desktop to tablet

✨ **Advanced Analytics**
- 🔥 Real-time interaction heatmap tracking 12+ user actions
- 📊 Visual analytics dashboard with engagement metrics
- 🎨 Professional UI with playful, accessible design
- ⚡ Fast in-memory data processing
- 🏗️ Complete interaction history for every action

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 36 |
| **Frontend** | React 19 + TypeScript |
| **Build** | Vite + TypeScript |
| **Styling** | CSS Grid + Flexbox (responsive `clamp()`) |
| **State** | React hooks + localStorage |
| **Packaging** | Electron Builder (NSIS for Windows) |

## Installation

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** 10+ (comes with Node.js)
- **Windows 10+** or compatible OS with Electron support

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/keerthisuryateja/DB-Visualizer.git
   cd DB-Visualizer/monkeydb-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev:desktop
   ```
   This launches Vite dev server + Electron together with hot reload.

4. **Build for production**
   ```bash
   npm run build:desktop
   ```
   Creates installer in `release/` directory.

## Usage

### Loading Data

1. **Start the app** → Hub page dashboard
2. **Click "Load Data Source"** in the sidebar
3. **Upload CSV or JSON** file
4. **Select delimiter** (auto-detected for CSV)
5. **Data automatically profiled** with schema inference

### Exploring Data

- **Table View**: Browse all rows with search, sort, pagination
- **Filter**: Search all columns simultaneously
- **Sort**: Click column headers to sort ascending/descending
- **Pagination**: Jump to pages or adjust rows-per-page (10/25/50/100)
- **Export**: Download filtered results as CSV

### Running Queries

1. Navigate to **Command** tab
2. Enter SQL-like query:
   ```sql
   SELECT * FROM data WHERE age > 25 LIMIT 50
   ```
3. View results in table format
4. Export or review query history

### Analytics

1. Navigate to **Analytics** tab
2. View **Data Profile**:
   - Column statistics (type, nulls, duplicates)
   - Data quality metrics
3. View **Interaction Heatmap**:
   - Real-time tracking of all user actions
   - Visual heat intensity based on frequency
   - 12 tracked action types (import, filter, sort, query, etc.)

## Project Structure

```
monkeydb-visualizer/
├── src/
│   ├── App.tsx                 # Core React app (1400+ lines, all features)
│   ├── App.css                 # Complete responsive design system
│   ├── main.tsx                # React entry point
│   └── vite-env.d.ts           # TypeScript Vite types
├── electron/
│   └── main.cjs                # Electron main process
├── public/
│   └── *                        # Static assets
├── dist/                        # Built output (generated)
├── release/                     # Packaged installer (generated)
├── index.html                  # HTML template
├── package.json                # Dependencies + scripts + Electron config
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── .github/
│   └── workflows/
│       ├── test.yml            # CI tests on PR/push
│       ├── build.yml           # Desktop app builds
│       └── release.yml         # Automated release on tags
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
└── README.md                   # This file
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run Vite dev server only (port 5173) |
| `npm run dev:desktop` | Run Electron + Vite dev server together |
| `npm run build` | Build TypeScript + Vite to `dist/` |
| `npm run build:desktop` | Build desktop app to `release/` |
| `npm run start` | Launch Electron app from `dist/` |
| `npm run preview` | Preview production build locally |

## CI/CD Pipeline

### GitHub Actions Workflows

**✅ Tests** (`.github/workflows/test.yml`)
- Triggers on every push and pull request
- Node.js 20+ setup
- Install dependencies
- TypeScript type checking
- Vite build validation
- Reports status in PR checks

**🏗️ Build** (`.github/workflows/build.yml`)
- Triggers on every push to main/develop
- Builds production web bundle
- Compiles desktop app (Windows NSIS installer)
- Uploads artifacts for download
- Stores in Actions tab for 90 days

**🚀 Release** (`.github/workflows/release.yml`)
- Triggers on git tag creation (`v*`)
- Runs full test suite
- Builds desktop installer
- Creates GitHub Release
- Uploads installer as Release asset
- Auto-generates release notes from commit messages

### Release Process

1. **Merge to main** with version bump in `package.json`
2. **Create git tag**:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. **Automated Release Action**:
   - Runs CI tests
   - Builds installer
   - Creates GitHub Release with installer attached
   - Publishes release notes

## Data Import Format

### CSV Support

- **Delimiters**: Comma, semicolon, tab, pipe (auto-detected)
- **Headers**: First row treated as column names
- **Types**: Automatically inferred (string, number, boolean, datetime, mixed)
- **Sample**: See `mock_student_data_comprehensive.csv` for realistic test dataset

### JSON Support

- **Format**: Array of objects or object with data array
- **Column Detection**: Properties from first object become columns
- **Nesting**: One level deep; deeply nested objects stored as JSON string

## Data Limits

- **Rows**: Tested up to 607 rows; scales based on available RAM
- **Columns**: Tested with 30 columns; no hard limit
- **File Size**: Practical limit ~50 MB for smooth import
- **Processing**: All data stays in memory (no streaming)

## Query API

### Supported Operations

```sql
-- SELECT all columns
SELECT * FROM data

-- SELECT specific columns (case-insensitive)
SELECT name, email FROM data

-- WHERE conditions (=, !=, >, <, >=, <=, AND, OR)
SELECT * FROM data WHERE age > 25 AND status = 'active'

-- LIMIT results
SELECT * FROM data LIMIT 50

-- Combine
SELECT name, email FROM data WHERE status = 'active' LIMIT 100
```

### Limitations

- No GROUP BY, DISTINCT, ORDER BY yet
- Case-insensitive matching
- Values compared as strings internally
- No JOIN operations

## State Management & Persistence

### Local Storage

All workspace state persists automatically:
- **Latest imported dataset** (rows, schema, profiles)
- **Query history** (10 most recent queries)
- **Interaction map** (counts for all 12 action types)
- **Preferences** (rows per page, sort state)

**Storage Key**: `db_visualizer_state_v2` (versioned to avoid conflicts)

### Reset Workspace

Clear browser cache or delete localStorage entry to reset:
```javascript
// In browser console
localStorage.removeItem('db_visualizer_state_v2')
window.location.reload()
```

## Development

### Setting Up Dev Environment

```bash
# Clone and install
git clone https://github.com/keerthisuryateja/DB-Visualizer.git
cd DB-Visualizer/monkeydb-visualizer
npm install

# Start development server
npm run dev:desktop

# In another terminal, check dev server
curl http://127.0.0.1:5173
```

### Making Changes

1. **React/TypeScript**: Edit `src/App.tsx` or split into components
2. **Styling**: Update `src/App.css` with responsive design
3. **Electron**: Modify `electron/main.cjs` for app behavior
4. **Build Config**: Edit `vite.config.ts` or `package.json` build section

Hot reload works automatically during `npm run dev:desktop`.

### Building for Distribution

```bash
# Test build locally
npm run build:desktop

# Check release/ directory
ls release/
# Outputs: DB Visualizer Setup 0.1.0.exe (or newer version)
```

### Testing Workflow

Before pushing:
```bash
npm run build        # No TypeScript errors?
npm run dev:desktop  # App launches and works?
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "npm: command not found" | Install Node.js from https://nodejs.org/ |
| "Cannot find module 'react'" | Run `npm install` |
| "Port 5173 already in use" | Kill existing Vite process or change port in vite.config.ts |
| "Electron app won't launch" | Check desktop terminal for error logs, ensure dist/ exists |
| "Data won't import" | Verify CSV has headers, uses standard delimiters (,;\\t\|) |
| "localStorage not working" | Clear browser cache; check Incognito mode |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style and lint rules
- Pull request process
- Testing requirements
- Commit message format

## Roadmap

📋 **Planned Features**
- [ ] Column visibility picker (show/hide columns dynamically)
- [ ] Advanced SQL (ORDER BY, GROUP BY, COUNT, aggregates)
- [ ] Multi-table support (dataset tabs)
- [ ] Visual column heatmap overlay
- [ ] Export analytics data (JSON metrics dump)
- [ ] Dark mode theme toggle
- [ ] Keyboard shortcuts reference panel
- [ ] Dataset undo/redo history

🔐 **Quality**
- [ ] Comprehensive unit tests (React + logic)
- [ ] E2E tests (Electron + UI interaction)
- [ ] Performance benchmarks (large datasets)
- [ ] Accessibility audit (WCAG 2.1)

## License

MIT License - See LICENSE file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/keerthisuryateja/DB-Visualizer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/keerthisuryateja/DB-Visualizer/discussions)
- **Documentation**: [Wiki](https://github.com/keerthisuryateja/DB-Visualizer/wiki)

## Credits

Built with ❤️ using React, Electron, and TypeScript.

---

**Made by [Keerth Surya Teja](https://github.com/keerthisuryateja)**

Have feedback? Create an issue or start a discussion! 🚀
