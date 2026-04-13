# 🚀 QUICK START - Your First Release

## Status: ✅ Everything is ready!

Your DB Visualizer is now on GitHub with full CI/CD. Here's exactly how to use it:

---

## Option 1: Test the CI/CD Pipeline (Recommended First)

### Step 1: Make a small test commit
```bash
cd "z:\Database Visualization App\monkeydb-visualizer"

# Make a tiny change
echo "# Test update" >> README.md

# Commit
git add README.md
git commit -m "test: verify ci/cd pipeline"

# Push to GitHub
git push origin main
```

### Step 2: Watch the automation
1. Go to: https://github.com/keerthisuryateja/DB-Visualizer/actions
2. Click the newest workflow run
3. Watch it execute automatically:
   - ✅ Checkout code
   - ✅ Install Node.js
   - ✅ Run TypeScript checks
   - ✅ Build validation
   - ✅ Build Windows installer

**Result**: Green checkmarks = everything works! 🎉

---

## Option 2: Create Your First Release (v0.2.0)

### Step 1: Prepare the release version
```bash
cd "z:\Database Visualization App\monkeydb-visualizer"

# Update version in package.json
# Change:  "version": "0.1.0" 
# To:      "version": "0.2.0"
```

### Step 2: Update CHANGELOG
```bash
# Edit CHANGELOG.md and add at the top:

## [0.2.0] - 2026-04-13

### Added
- Complete CI/CD pipelines with GitHub Actions
- Professional documentation (README, CONTRIBUTING, CHANGELOG)
- MIT License for open-source distribution
- Automated release workflow on git tags
- Build artifacts for Windows installer

### Improved
- Enhanced .gitignore with release patterns
```

### Step 3: Commit version changes
```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.2.0"
git push origin main

# Wait ~3 minutes for build.yml to complete
```

### Step 4: Create release tag
```bash
# Tag the version
git tag v0.2.0

# Push the tag
git push origin v0.2.0
```

### Step 5: Watch the release happen!
1. Go to: https://github.com/keerthisuryateja/DB-Visualizer/actions
2. Click the "Release" workflow run
3. Watch it:
   - ✅ Run tests
   - ✅ Build installer
   - ✅ Create GitHub Release
   - ✅ Upload installer file

**Result**: Check https://github.com/keerthisuryateja/DB-Visualizer/releases
- You'll see **v0.2.0** with a downloadable `.exe` file!

---

## What Workflows Do

### 🧪 test.yml (Automatic on every push)
```
Every time you: git push origin main

GitHub automatically:
  ✅ Checks TypeScript for errors
  ✅ Validates your code compiles
  ✅ Reports pass/fail status
  ✅ Stores build artifacts (7 days)
```

### 🏗️ build.yml (Automatic on push to main)
```
Every time you: git push origin main

GitHub automatically:
  ✅ Builds Windows NSIS installer (.exe)
  ✅ Builds web bundle (HTML/CSS/JS)
  ✅ Stores artifacts (90 days)
  ✅ Available in Actions tab
```

### 🎉 release.yml (Automatic on git tag)
```
When you: git tag vX.Y.Z && git push origin vX.Y.Z

GitHub automatically:
  ✅ Runs full test suite
  ✅ Builds Windows installer
  ✅ Creates GitHub Release page
  ✅ Uploads .exe as downloadable file
  ✅ Publishes release notes
  ✅ Available at /releases
```

---

## Useful Commands Reference

```bash
# Check current status
git status

# View remote
git remote -v

# View commit history
git log --oneline -5

# Step-by-step workflow:
# 1. Make changes
# 2. Stage changes
git add .

# 3. Commit with message
git commit -m "feat: your feature description"

# 4. Push to GitHub
git push origin main

# 5. For releases - create tag
git tag v0.2.0

# 6. Push tag
git push origin v0.2.0

# View all tags
git tag -l

# Delete tag (if needed)
git tag -d v0.2.0           # Local
git push origin :v0.2.0     # Remote
```

---

## GitHub URLs You Need

| What | URL |
|------|-----|
| **View your code** | https://github.com/keerthisuryateja/DB-Visualizer |
| **Watch workflows** | https://github.com/keerthisuryateja/DB-Visualizer/actions |
| **Download releases** | https://github.com/keerthisuryateja/DB-Visualizer/releases |
| **Report issues** | https://github.com/keerthisuryateja/DB-Visualizer/issues |
| **Get artifacts** | https://github.com/keerthisuryateja/DB-Visualizer/actions → click run → Artifacts |

---

## Files to Know

```
Your project now has:

.github/workflows/
  ├── test.yml          ← Runs on every push (tests)
  ├── build.yml         ← Runs on push to main (builds)
  └── release.yml       ← Runs on git tag v* (releases)

Documentation:
  ├── README.md         ← User guide
  ├── CONTRIBUTING.md   ← Developer guide
  ├── CHANGELOG.md      ← Version history
  └── LICENSE           ← MIT License

Setup:
  ├── package.json      ← Version here
  └── .gitignore        ← What to ignore in git
```

---

## Common Workflows

### Releasing Code
```bash
# 1. Update version
nano package.json    # Change version number

# 2. Update changelog
nano CHANGELOG.md    # Add release notes

# 3. Commit
git add package.json CHANGELOG.md
git commit -m "chore: release v0.2.0"
git push origin main

# 4. Tag
git tag v0.2.0
git push origin v0.2.0

# ← GitHub Actions handles the rest!
```

### Adding a Feature
```bash
# 1. Make changes
# 2. Test locally: npm run dev:desktop
# 3. Commit: git commit -m "feat: new feature"
# 4. Push: git push origin main
# ← GitHub Actions tests automatically!
```

### Fixing a Bug
```bash
# 1. Fix the code
# 2. Test: npm run build
# 3. Commit: git commit -m "fix: bug description"
# 4. Push: git push origin main
# ← GitHub Actions validates automatically!
```

---

## Verify Everything Works

```bash
# Terminal 1: Verify git is set up
cd "z:\Database Visualization App\monkeydb-visualizer"
git remote -v
# Output should show: origin https://github.com/keerthisuryateja/DB-Visualizer.git

# Terminal 2: Check current status
git status
# Output should show: On branch main, Your branch is up to date

# Terminal 3: View recent commits
git log --oneline -3
# Output should show your recent commits pushed to GitHub

# Terminal 4: Verify workflows exist
ls .github/workflows/
# Output should show: build.yml, release.yml, test.yml
```

---

## What Happens Next

### When you push code:
1. GitHub detects push to main
2. Runs test.yml workflow (2-3 min)
3. Reports pass/fail
4. Runs build.yml workflow (5-10 min)
5. Creates installer in artifacts

### When you create a release tag:
1. GitHub detects tag v*
2. Runs release.yml workflow (10-15 min)
3. Creates GitHub Release page
4. Uploads installer as asset
5. Appears in /releases with download button

### When contributors make PRs:
1. GitHub detects PR
2. Runs test.yml workflow
3. Reports pass/fail on PR
4. Maintainer can safely merge if tests pass

---

## Support

**Something not working?**

1. Check GitHub Actions tab: https://github.com/keerthisuryateja/DB-Visualizer/actions
2. Click the failed workflow
3. Scroll through logs to find error message
4. Common issues:
   - `npm install` failed → check package.json is valid JSON
   - Build failed → check `npm run build` passes locally first
   - Release not created → check tag starts with `v` (v0.2.0 not 0.2.0)

**Having git trouble?**

```bash
# Reset to remote state
git fetch origin
git reset --hard origin/main

# Or check what's wrong
git status
git log --oneline -5
```

---

## 🎉 You're All Set!

Your DB Visualizer is:
- ✅ On GitHub
- ✅ Ready for releases
- ✅ Automated testing
- ✅ Professional documentation
- ✅ Open-source ready

**Next step**: `git push origin main` or create your first tag!

---

**Repository**: https://github.com/keerthisuryateja/DB-Visualizer

Made with ❤️ using GitHub Actions

