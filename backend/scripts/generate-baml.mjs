#!/usr/bin/env node
import { rmSync, existsSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const legacyDir = join(projectRoot, 'src', 'baml_client');
const outputDir = join(projectRoot, 'baml_client');

// Clean legacy copies so baml-cli can regenerate without complaints
rmSync(legacyDir, { recursive: true, force: true });
rmSync(outputDir, { recursive: true, force: true });

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npxCommand, ['baml-cli', 'generate'], { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// Remove any JavaScript artefacts to keep the client TypeScript-only
if (existsSync(outputDir)) {
  for (const entry of readdirSync(outputDir)) {
    if (entry.endsWith('.js')) {
      unlinkSync(join(outputDir, entry));
    }
  }
}

const importPattern = /(from\s+["'])(\.\.?(?:\/[\w.-]+)+)(["'];?)/g;

if (existsSync(outputDir)) {
  for (const entry of readdirSync(outputDir)) {
    if (entry.endsWith('.ts')) {
      const fullPath = join(outputDir, entry);
      const original = readFileSync(fullPath, 'utf8');
      const updated = original.replace(importPattern, (_match, prefix, specifier, suffix) => {
        if (specifier.endsWith('.js') || specifier.endsWith('.ts') || specifier.endsWith('.mjs') || specifier.endsWith('.cjs')) {
          return `${prefix}${specifier}${suffix}`;
        }
        return `${prefix}${specifier}.js${suffix}`;
      });

      if (updated !== original) {
        writeFileSync(fullPath, updated);
      }
    }
  }
}
