# Project Skills

This project includes [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) as a git submodule.

## Setup

After cloning the repo, initialize the submodule and link skills for Cursor:

```powershell
git submodule update --init --recursive
powershell -ExecutionPolicy Bypass -File scripts/install-cursor-skills.ps1
```

## Update skills

```powershell
git submodule update --remote .cursor/skills/awesome-claude-skills
powershell -ExecutionPolicy Bypass -File scripts/install-cursor-skills.ps1
```

Skill junctions in this folder (except `awesome-claude-skills/`) are generated locally and gitignored.
