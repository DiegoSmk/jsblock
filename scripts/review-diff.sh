#!/usr/bin/env sh
set -eu

# review-diff.sh
# Generate a single markdown file with all diff info for AI review.
# Works in any git repo/branch.

usage() {
  cat <<'USAGE'
Usage: review-diff.sh [options]

Options:
  -b, --base <ref>     Base ref to diff against (default: auto detect)
  -o, --out <file>     Output file (default: ./review-diff.md)
  -j, --json <file>    JSON output file (default: ./review-diff.json)
  -C, --context <n>    Diff context lines (default: 3)
  --no-full-diff       Skip full patch diff (only metadata)
  -h, --help           Show this help

Examples:
  ./scripts/review-diff.sh
  ./scripts/review-diff.sh -b main -o /tmp/review.md
  ./scripts/review-diff.sh --no-full-diff
USAGE
}

BASE=""
OUT="review-diff.md"
OUT_JSON="review-diff.json"
CONTEXT=3
FULL_DIFF=1

while [ $# -gt 0 ]; do
  case "$1" in
    -b|--base)
      BASE="$2"; shift 2;;
    -o|--out)
      OUT="$2"; shift 2;;
    -j|--json)
      OUT_JSON="$2"; shift 2;;
    -C|--context)
      CONTEXT="$2"; shift 2;;
    --no-full-diff)
      FULL_DIFF=0; shift 1;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1" >&2
      usage; exit 1;;
  esac
done

# Ensure we are in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2
  exit 1
fi

# Auto-detect base if not provided
if [ -z "$BASE" ]; then
  # Interactive selection if running in a TTY
  if [ -t 0 ]; then
    echo "Select base branch/ref for diff:"
    echo
    # Build list: locals first, then remotes. Keep recommended at top.
    LOCALS=$(git for-each-ref --format='%(refname:short)' refs/heads | sort -u)
    REMOTES=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin | \
      grep -v '^origin/HEAD$' | \
      sort -u)

    # Recommended candidates (top)
    RECOMMENDED=$(printf "%s\n" "$LOCALS" "$REMOTES" | \
      grep -E '^(main|dev|master)$|^release/|^origin/(main|dev|master)$|^origin/release/' | \
      sort -u)

    # Remaining candidates
    REMAINING=$(printf "%s\n" "$LOCALS" "$REMOTES" | \
      grep -v -E '^(main|dev|master)$|^release/|^origin/(main|dev|master)$|^origin/release/' | \
      sort -u)

    CANDIDATES=$(printf "%s\n" "$RECOMMENDED" "$REMAINING" | awk 'NF' )

    if [ -n "$CANDIDATES" ]; then
      i=1
      for b in $CANDIDATES; do
        if printf "%s\n" "$RECOMMENDED" | grep -qx "$b"; then
          echo "  [$i] $b (recomendado)"
        else
          echo "  [$i] $b"
        fi
        i=$((i+1))
      done
      echo "  [$i] Other (type manually)"
      echo
      printf "Choice: "
      read -r CHOICE

      if [ "$CHOICE" = "$i" ]; then
        printf "Enter ref/branch: "
        read -r BASE
      else
        # Map numeric selection to candidate
        idx=1
        for b in $CANDIDATES; do
          if [ "$CHOICE" = "$idx" ]; then
            BASE="$b"
            break
          fi
          idx=$((idx+1))
        done
      fi
    else
      printf "Enter ref/branch (e.g., main): "
      read -r BASE
    fi
  fi

  # Non-interactive fallback (or if still empty)
  if [ -z "$BASE" ]; then
    if git show-ref --verify --quiet refs/heads/main; then
      BASE="main"
    elif git show-ref --verify --quiet refs/heads/master; then
      BASE="master"
    elif git show-ref --verify --quiet refs/heads/dev; then
      BASE="dev"
    elif git show-ref --verify --quiet refs/remotes/origin/main; then
      BASE="origin/main"
    elif git show-ref --verify --quiet refs/remotes/origin/master; then
      BASE="origin/master"
    else
      # fallback to HEAD~1 if nothing else
      BASE="HEAD~1"
    fi
  fi
fi

MERGE_BASE=$(git merge-base HEAD "$BASE" 2>/dev/null || true)
if [ -z "$MERGE_BASE" ]; then
  MERGE_BASE="$BASE"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
ROOT=$(git rev-parse --show-toplevel)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build output
{
  echo "# Review Diff Bundle"
  echo
  echo "- Repo: $ROOT"
  echo "- Branch: $BRANCH"
  echo "- Base: $BASE"
  echo "- Merge-base: $MERGE_BASE"
  echo "- Generated: $DATE"
  echo
  echo "## Git Status"
  echo "\`\`\`"
  git status -sb
  echo "\`\`\`"
  echo
  echo "## Commits (base..HEAD)"
  echo "\`\`\`"
  git log --oneline "$MERGE_BASE"..HEAD
  echo "\`\`\`"
  echo
  echo "## Changed Files (name-status)"
  echo "\`\`\`"
  git diff --name-status "$MERGE_BASE"..HEAD
  echo "\`\`\`"
  echo
  echo "## Changed Files (stat)"
  echo "\`\`\`"
  git diff --stat "$MERGE_BASE"..HEAD
  echo "\`\`\`"
  echo
  echo "## Changed Files (numstat)"
  echo "\`\`\`"
  git diff --numstat "$MERGE_BASE"..HEAD
  echo "\`\`\`"
  echo
  if [ $FULL_DIFF -eq 1 ]; then
    echo "## Full Diff"
    echo "\`\`\`diff"
    git diff --unified=$CONTEXT "$MERGE_BASE"..HEAD
    echo "\`\`\`"
    echo
  else
    echo "## Full Diff"
    echo "(skipped)"
    echo
  fi

  echo "## Binary Files"
  echo "\`\`\`"
  git diff --numstat "$MERGE_BASE"..HEAD | awk '($1=="-" && $2=="-"){print $0}'
  echo "\`\`\`"
} > "$OUT"

# JSON output (simple and tool-friendly)
{
  printf "{\n"
  printf "  \"repo\": \"%s\",\n" "$ROOT"
  printf "  \"branch\": \"%s\",\n" "$BRANCH"
  printf "  \"base\": \"%s\",\n" "$BASE"
  printf "  \"mergeBase\": \"%s\",\n" "$MERGE_BASE"
  printf "  \"generatedAt\": \"%s\",\n" "$DATE"

  printf "  \"status\": \"%s\",\n" "$(git status -sb | sed 's/\"/\\\\\"/g')"

  printf "  \"commits\": [\n"
  git log --oneline "$MERGE_BASE"..HEAD | awk 'BEGIN{first=1} {gsub(/"/,"\\\""); printf "    %s\"%s\"\n", (first? "": ","), $0; first=0}' 
  printf "  ],\n"

  printf "  \"nameStatus\": [\n"
  git diff --name-status "$MERGE_BASE"..HEAD | awk 'BEGIN{first=1} {gsub(/"/,"\\\""); printf "    %s\"%s\"\n", (first? "": ","), $0; first=0}'
  printf "  ],\n"

  printf "  \"stat\": [\n"
  git diff --stat "$MERGE_BASE"..HEAD | awk 'BEGIN{first=1} {gsub(/"/,"\\\""); printf "    %s\"%s\"\n", (first? "": ","), $0; first=0}'
  printf "  ],\n"

  printf "  \"numstat\": [\n"
  git diff --numstat "$MERGE_BASE"..HEAD | awk 'BEGIN{first=1} {gsub(/"/,"\\\""); printf "    %s\"%s\"\n", (first? "": ","), $0; first=0}'
  printf "  ]\n"
  printf "}\n"
} > "$OUT_JSON"

echo "Wrote: $OUT"
echo "Wrote: $OUT_JSON"
