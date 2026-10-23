# Test runner image: Playwright, its browsers and the project's specs.
#
# RULE: PLAYWRIGHT_VERSION must equal the @playwright/test version in package-lock.json.
# The browsers in the base image are built for that exact Playwright release; a mismatch fails
# with "Executable doesn't exist" errors. When upgrading @playwright/test, bump this value too.
# The check after `npm ci` below enforces the rule: the build fails if the versions differ.
ARG PLAYWRIGHT_VERSION=1.61.1

# noble = Ubuntu 24.04 LTS
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

# An ARG declared before FROM is not visible after it unless declared again.
ARG PLAYWRIGHT_VERSION

WORKDIR /app

# Dependencies first: this layer is rebuilt only when the manifests change, not on every spec edit.
# HUSKY=0 skips installing git hooks (the image has no .git).
COPY package.json package-lock.json ./
RUN HUSKY=0 npm ci
RUN installed="$(npx playwright --version)"; \
    [ "$installed" = "Version ${PLAYWRIGHT_VERSION}" ] \
    || { echo "Base image is Playwright ${PLAYWRIGHT_VERSION}, but package-lock.json installs: ${installed}" >&2; exit 1; }

# Only what the tests need at runtime; the rest is excluded by .dockerignore.
COPY playwright.config.ts tsconfig.json ./
COPY src ./src
COPY files ./files

CMD ["npx", "playwright", "test"]
