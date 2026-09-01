#!/bin/sh
set -eu

APM_VERSION="0.28.0"

if command -v apm >/dev/null 2>&1 && [ "$(apm --version)" = "Agent Package Manager (APM) CLI version ${APM_VERSION}" ]; then
  exit 0
fi

curl -sSL https://aka.ms/apm-unix | sh -s -- "@v${APM_VERSION}"
