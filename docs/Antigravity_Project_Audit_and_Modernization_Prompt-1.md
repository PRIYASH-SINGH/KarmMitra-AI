# Antigravity — Full Project Audit & Modernization Prompt

You are an expert software architect, senior developer, security auditor, QA engineer, DevOps engineer, and technical researcher.

Your task is to perform a **complete end-to-end audit of the entire project folder**, deeply inspect every file and subfolder, identify and fix problems, and bring the project fully up to date with the **current system architecture, dependencies, configuration, and project requirements**.

Do **not** perform a superficial review. Treat this as a production-level technical audit and modernization project.

---

## 1. Audit the Entire Project

Recursively inspect the **entire project directory**.

Examine:

- Every source-code file
- Every configuration file
- Every requirements/dependency file
- Every environment/configuration template
- Every script
- Every API/service
- Every component/module
- Every utility/helper
- Every test
- Every documentation file
- Every database/schema/migration file
- Every build/deployment file
- Every Docker/container configuration
- Every CI/CD configuration
- Every asset/configuration folder
- Every nested subfolder
- Hidden configuration files where accessible
- Project metadata and lock files

Do not skip files simply because they appear old, redundant, small, or unrelated.

First create an understanding of the complete project structure and how all components interact.

---

## 2. Understand the Current System

Determine:

- What the project is designed to do
- Current architecture
- Technology stack
- Programming languages
- Frameworks
- Runtime versions
- Package/dependency management
- Database architecture
- API architecture
- Frontend architecture, if applicable
- Backend architecture, if applicable
- Authentication/authorization
- External integrations
- Build system
- Deployment system
- Environment configuration
- Testing architecture
- Logging and monitoring
- Data flow
- File/data dependencies
- Entry points
- Background jobs/workers
- Third-party services

Build a mental model of how the entire system works before making modifications.

---

## 3. Deep Research

Perform deep technical research wherever necessary.

For every important technology, framework, library, package, API, runtime, or configuration:

1. Determine the currently appropriate/stable version compatible with the project.
2. Check official documentation and current best practices.
3. Identify deprecated APIs, packages, configuration options, and patterns.
4. Identify breaking changes between current and newer versions.
5. Identify security vulnerabilities or known problematic dependencies.
6. Determine whether dependencies should be upgraded, replaced, removed, or retained.
7. Verify that proposed changes are compatible with the rest of the project.

Prefer **official documentation and authoritative technical sources** over random tutorials or outdated articles.

Do not upgrade dependencies blindly.

---

## 4. Find All Errors and Problems

Search systematically for:

### Code Problems

- Syntax errors
- Runtime errors
- Logic errors
- Incorrect imports
- Circular dependencies
- Undefined variables/functions
- Incorrect types
- Incorrect API usage
- Incorrect function calls
- Incorrect async/sync handling
- Race conditions
- Resource leaks
- Memory issues
- Error-handling problems
- Dead code
- Duplicate code
- Unreachable code
- Incorrect assumptions

### Architecture Problems

- Poor separation of concerns
- Tight coupling
- Incorrect module boundaries
- Incorrect dependency direction
- Redundant systems
- Inconsistent patterns
- Scalability problems
- Maintainability problems

### Security Problems

- Hardcoded secrets
- Credential exposure
- Unsafe environment handling
- Injection vulnerabilities
- Authentication flaws
- Authorization flaws
- Unsafe file operations
- Insecure API endpoints
- Dependency vulnerabilities
- Sensitive information leakage
- Improper validation/sanitization
- Insecure defaults

**Never expose or reproduce real secrets in documentation or output.**

### Performance Problems

- Unnecessary API calls
- Inefficient algorithms
- Excessive database queries
- N+1 queries
- Unnecessary rendering
- Memory-heavy operations
- Blocking operations
- Unnecessary network requests
- Poor caching
- Inefficient file operations

### Configuration Problems

- Invalid configuration
- Missing configuration
- Conflicting configuration
- Outdated configuration
- Incorrect environment variables
- Incorrect paths
- Incorrect ports
- Incorrect service references
- Development/production inconsistencies

---

## 5. Requirements & Dependency Audit

Thoroughly audit **all dependency/requirements files**.

Examples include:

- `requirements.txt`
- `requirements-dev.txt`
- `pyproject.toml`
- `package.json`
- `package-lock.json`
- `yarn.lock`
- `pnpm-lock.yaml`
- `composer.json`
- `Gemfile`
- `go.mod`
- `Cargo.toml`
- `pom.xml`
- `build.gradle`
- Dockerfiles
- Environment files
- Project-specific dependency files

For each dependency:

- Determine why it exists.
- Determine where it is used.
- Determine whether it is outdated.
- Check compatibility.
- Check security issues.
- Check whether it is redundant.
- Check whether it is abandoned/deprecated.
- Upgrade where appropriate.
- Remove unused dependencies where safe.
- Add missing dependencies when genuinely required.
- Synchronize lock files where applicable.

Do not add dependencies just to solve something that can reasonably be solved with the existing stack.

---

## 6. Update the Project to the Current System Layout

Bring the project in line with the **current actual system architecture**.

Identify outdated assumptions, obsolete paths, old module names, old environment variables, deprecated APIs, or legacy architecture.

Update them consistently across:

- Source code
- Configuration
- Requirements
- Environment templates
- Scripts
- Tests
- Documentation
- Build files
- Deployment files
- Docker configuration
- CI/CD
- API references
- Import paths
- File paths
- Module references
- Service names
- Database configuration

There must be **one consistent source of truth** for the current architecture.

Do not leave partially migrated or contradictory configurations.

---

## 7. Fix Problems — Don't Just Report Them

When a problem can safely be fixed:

**FIX IT.**

Do not merely write that something "could be improved."

For every modification:

1. Understand the root cause.
2. Make the smallest appropriate architectural change.
3. Preserve existing functionality unless it is demonstrably broken or obsolete.
4. Update dependent files.
5. Update tests.
6. Validate the change.
7. Check for regressions.

Avoid unnecessary rewrites.

---

## 8. Test After Every Major Change

Run the project's available validation mechanisms.

Use whatever applies:

- Unit tests
- Integration tests
- End-to-end tests
- Type checking
- Linting
- Formatting checks
- Build
- Compilation
- Dependency checks
- Security scans
- Static analysis
- Application startup
- API health checks

If a test fails:

1. Investigate the actual root cause.
2. Fix it.
3. Run the test again.
4. Continue until the project reaches the best achievable stable state.

Do not hide or suppress failures simply to make the test suite pass.

---

## 9. Check for Inconsistencies Across Files

Cross-reference the entire repository.

Look for:

- Different dependency versions
- Different environment variable names
- Old and new API routes
- Old module paths
- Incorrect documentation
- Outdated README instructions
- Configuration mismatches
- Incorrect ports
- Old service names
- Duplicate configuration
- Different runtime versions
- Tests targeting obsolete behavior
- Deployment configuration that does not match local configuration

Fix inconsistencies so the project has a coherent architecture.

---

## 10. Documentation Update

Update documentation to reflect the actual current system.

Review and update:

- README
- Setup instructions
- Installation instructions
- Environment variable documentation
- Architecture documentation
- API documentation
- Development instructions
- Testing instructions
- Deployment instructions
- Troubleshooting
- Dependency information
- Project structure documentation

Documentation must describe the **actual implementation**, not an intended or outdated implementation.

---

## 11. Cleanup

Identify safe cleanup opportunities:

- Unused files
- Unused imports
- Unused dependencies
- Dead code
- Duplicate configuration
- Obsolete scripts
- Legacy modules
- Temporary files
- Generated artifacts that should not be committed
- Incorrect `.gitignore` entries
- Redundant documentation

Do not delete anything important merely because it appears unused.

Before deleting something, verify that it is genuinely unnecessary.

---

## 12. Security & Secrets

Perform a dedicated security audit.

Search for:

- API keys
- Tokens
- Passwords
- Private keys
- Credentials
- Connection strings
- Secrets accidentally committed
- Unsafe environment handling

If real secrets are found:

- Do not expose them in your response.
- Replace hardcoded secrets with environment/configuration references where appropriate.
- Update example configuration files with safe placeholders.
- Explain that exposed credentials should be rotated if they were actually compromised.

---

## 13. Final Validation

Before declaring the work complete, perform a final recursive audit.

Verify:

- Project builds successfully where applicable.
- Tests pass.
- Dependencies are consistent.
- Configuration is consistent.
- Imports are correct.
- No obvious broken references remain.
- No obsolete paths remain.
- No unintended duplicate systems remain.
- Documentation matches implementation.
- Requirements files match actual usage.
- Lock files are synchronized where applicable.
- Deployment configuration matches the current architecture.
- No accidental secrets were introduced.
- No temporary/debug code remains.
- No unnecessary files were created.

---

## 14. Execution Strategy

Follow this order:

### Phase 1 — Discovery
Map the complete project.

### Phase 2 — Architecture Analysis
Understand how everything connects.

### Phase 3 — Deep Research
Research outdated/deprecated technologies and current best practices.

### Phase 4 — Error Detection
Find bugs, security problems, dependency problems, configuration problems, and inconsistencies.

### Phase 5 — Implementation
Fix confirmed problems.

### Phase 6 — Dependency & Requirements Update
Synchronize all requirements and dependency files.

### Phase 7 — System Layout Migration
Update paths, modules, configuration, services, APIs, and references to the current architecture.

### Phase 8 — Testing
Run all available validation.

### Phase 9 — Documentation
Update documentation to match the final implementation.

### Phase 10 — Final Audit
Re-scan the complete project to ensure nothing was missed.

---

## 15. Change Log

Maintain a clear record of the work performed.

For each meaningful change, record:

- File
- Problem
- Root cause
- Fix
- Reason for the chosen solution
- Validation performed

Group changes into:

- Critical fixes
- Security fixes
- Dependency updates
- Architecture updates
- Configuration updates
- Performance improvements
- Cleanup
- Documentation updates

---

## 16. Final Report

At the end, provide a concise but comprehensive report containing:

### Project Health

- Overall status
- Build status
- Test status
- Security status
- Dependency status

### Problems Found

- Critical
- High
- Medium
- Low

### Problems Fixed

List the important fixes and affected files.

### Requirements Updated

List:

- Added dependencies
- Removed dependencies
- Upgraded dependencies
- Changed versions
- Updated lock files

### Architecture Changes

Explain the important architectural changes.

### Security Findings

Explain vulnerabilities and remediation without exposing secrets.

### Remaining Issues

Only include issues that genuinely could not be fixed automatically or safely.

For each remaining issue explain:

- Why it remains
- What is required to fix it
- Its priority

### Validation

Report the actual commands/checks performed and their results.

---

# Critical Final Instruction

Do not stop after finding problems.

**Inspect → Research → Diagnose → Fix → Test → Re-audit → Document.**

The goal is not to produce an audit document.

The goal is to leave the project in the **most stable, secure, maintainable, compatible, and up-to-date state that can reasonably be achieved without changing its intended functionality.**

If you encounter uncertainty, investigate the repository and authoritative documentation before making a decision.

**Start with the complete project-folder audit now.**
