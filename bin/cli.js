#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, unlinkSync, rmSync, copyFileSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLUGIN_NAME = 'opencode-lisa';

const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function printHelp() {
  console.log(`
${colors.cyan('Lisa - Intelligent Epic Workflow Plugin')}

Usage:
  npx ${PLUGIN_NAME} --opencode

Options:
  --opencode    Install Lisa for OpenCode in current directory
  --help, -h    Show this help message

Example:
  npx ${PLUGIN_NAME} --opencode

After installation, run ${colors.cyan('opencode')} and type ${colors.cyan('/lisa help')} to get started!
`);
}

async function checkOpenCodeInstalled() {
  try {
    // Check if opencode command exists
    const { execSync } = await import('child_process');
    execSync('which opencode', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function cleanupOldInstalls(targetDir) {
  // Remove old file-based installations from previous versions
  // Note: We no longer clean up 'skills/lisa' since we install there now
  const oldPaths = [
    join(targetDir, '.opencode', 'skill', 'lisa'), // old singular path
    join(targetDir, '.opencode', 'command', 'lisa.md'), // old singular path
  ];

  for (const oldPath of oldPaths) {
    try {
      if (existsSync(oldPath)) {
        const stat = statSync(oldPath);
        if (stat.isDirectory()) {
          rmSync(oldPath, { recursive: true, force: true });
        } else {
          unlinkSync(oldPath);
        }
        console.log(colors.dim(`  Cleaned up old install: ${oldPath}`));
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
}

function installCommandFiles(targetDir) {
  // All Lisa command files to install
  const commandFiles = [
    'lisa-create-epic.md',
    'lisa-list-epics.md',
    'lisa-epic-status.md',
    'lisa-continue.md',
    'lisa-yolo.md',
    'lisa-help.md'
  ];
  
  // Create destination directory if needed
  const destDir = join(targetDir, '.opencode', 'commands');
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  
  // Copy each command file
  for (const file of commandFiles) {
    const sourcePath = join(__dirname, '..', 'assets', 'commands', file);
    const destPath = join(destDir, file);
    
    // Verify source file exists
    if (!existsSync(sourcePath)) {
      throw new Error(`Source command file not found: ${sourcePath}`);
    }
    
    // Copy file (overwrite if exists to ensure latest version)
    copyFileSync(sourcePath, destPath);
    console.log(colors.green(`  Created: ${destPath}`));
  }
}

function installSkillFiles(targetDir) {
  // All skill directories to install
  const skillDirs = [
    'lisa-create-epic',
    'lisa-continue',
    'lisa-yolo',
    'lisa-list-epics',
    'lisa-epic-status',
    'shared'
  ];
  
  const destBaseDir = join(targetDir, '.opencode', 'skills');
  
  for (const skillDir of skillDirs) {
    const sourcePath = join(__dirname, '..', 'assets', 'skills', skillDir, 'SKILL.md');
    const destPath = join(destBaseDir, skillDir, 'SKILL.md');
    
    // For shared, use COMMON.md instead
    const sourceFile = skillDir === 'shared' ? 'COMMON.md' : 'SKILL.md';
    const actualSourcePath = join(__dirname, '..', 'assets', 'skills', skillDir, sourceFile);
    const actualDestPath = join(destBaseDir, skillDir, sourceFile);
    
    // Verify source exists
    if (!existsSync(actualSourcePath)) {
      throw new Error(`Source skill file not found: ${actualSourcePath}`);
    }
    
    // Create directory if needed
    const destDir = dirname(actualDestPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    // Copy file
    copyFileSync(actualSourcePath, actualDestPath);
    console.log(colors.green(`  Created: ${actualDestPath}`));
  }
}

async function install(targetDir) {
  console.log('');
  console.log(colors.cyan('Lisa - Intelligent Epic Workflow Plugin'));
  console.log('');

  // Check if OpenCode is installed
  const isOpenCodeInstalled = checkOpenCodeInstalled();
  if (!isOpenCodeInstalled) {
    console.log(colors.red('Error: OpenCode is not installed or not in PATH.'));
    console.log('');
    console.log('Please install OpenCode first:');
    console.log(`  ${colors.cyan('brew install opencode')} (macOS)`);
    console.log(`  ${colors.cyan('npm install -g @opencode-ai/cli')} (other platforms)`);
    console.log('');
    console.log('Then run this installer again.');
    process.exit(1);
  }

  // Cleanup old file-based installs
  cleanupOldInstalls(targetDir);

  // Install command files for slash command autocomplete
  try {
    installCommandFiles(targetDir);
  } catch (err) {
    console.log(colors.red(`Error: Failed to install command files.`));
    console.log(colors.dim(`  ${err.message}`));
    console.log('');
    console.log('Lisa cannot be installed without the command files.');
    console.log('Please report this issue at https://github.com/fractalswift/lisa-simpson/issues');
    process.exit(1);
  }

  // Install skill files for Lisa workflow logic
  try {
    installSkillFiles(targetDir);
  } catch (err) {
    console.log(colors.red(`Error: Failed to install skill files.`));
    console.log(colors.dim(`  ${err.message}`));
    console.log('');
    console.log('Lisa cannot be installed without the skill files.');
    console.log('Please report this issue at https://github.com/fractalswift/lisa-simpson/issues');
    process.exit(1);
  }

  // Update or create opencode.json
  const configPath = join(targetDir, 'opencode.json');
  let config = {};
  let configExisted = false;

  if (existsSync(configPath)) {
    configExisted = true;
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch (e) {
      console.log(colors.red(`Error: ${configPath} exists but is not valid JSON.`));
      console.log(colors.dim(`  ${e.message}`));
      process.exit(1);
    }
  }

  // Ensure plugin array exists
  if (!config.plugin) {
    config.plugin = [];
  }

  // Check if already installed
  if (config.plugin.includes(PLUGIN_NAME)) {
    console.log(colors.yellow(`Lisa is already configured in this project.`));
    console.log('');
    console.log(`Run ${colors.cyan('opencode')} and type ${colors.cyan('/lisa help')} to get started!`);
    console.log('');
    return;
  }

  // Add the plugin
  config.plugin.push(PLUGIN_NAME);

  // Add schema if not present
  if (!config.$schema) {
    config.$schema = 'https://opencode.ai/config.json';
  }

  // Write config
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  if (configExisted) {
    console.log(colors.green(`  Updated: ${configPath} (added ${PLUGIN_NAME} to plugins)`));
  } else {
    console.log(colors.green(`  Created: ${configPath}`));
  }

  console.log('');
  console.log(colors.green('Done!'));
  console.log('');
  console.log('Lisa is now installed and will be auto-downloaded by OpenCode.');
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Run ${colors.cyan('opencode')} to start OpenCode`);
  console.log(`  2. Type ${colors.cyan('/lisa help')} to see available commands`);
  console.log(`  3. Type ${colors.cyan('/lisa <epic-name>}')} to create your first epic`);
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse flags
  const opencodeFlag = args.includes('--opencode');
  const help = args.includes('--help') || args.includes('-h');

  if (help || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  if (!opencodeFlag) {
    console.log(colors.red(`Unknown flag: ${args.find(a => a.startsWith('--')) || args[0]}`));
    console.log(`Run ${colors.cyan(`npx ${PLUGIN_NAME} --help`)} for usage.`);
    process.exit(1);
  }

  const targetDir = process.cwd();
  await install(targetDir);
}

main().catch((err) => {
  console.error(colors.red('Error:'), err.message);
  process.exit(1);
});
