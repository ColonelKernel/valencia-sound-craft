#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const targetBranch = process.env.LOVABLE_BRANCH || "main";

function fail(message) {
  console.error(`\n[lovable] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const [command = "status", ...rest] = argv;
  const options = {
    allowEmpty: command === "rebuild",
    message: command === "rebuild" ? "trigger rebuild" : "Sync Lovable preview",
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--message" || arg === "-m") {
      const value = rest[index + 1];
      if (!value) {
        fail("Missing value for --message.");
      }

      options.message = value;
      index += 1;
      continue;
    }

    if (arg === "--allow-empty") {
      options.allowEmpty = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return { command: "help", options };
    }

    fail(`Unknown argument: ${arg}`);
  }

  return { command, options };
}

function runCapture(command, args, extraOptions = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...extraOptions,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(detail || `${command} ${args.join(" ")} failed with code ${result.status}.`);
  }

  return result.stdout.trim();
}

function runStatus(command, args) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

async function runStreaming(command, args, { logFile } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = `$ ${command} ${args.join(" ")}\n\n`;

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      output += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      Promise.resolve(logFile ? writeFile(logFile, output, "utf8") : undefined)
        .then(() => resolve({ code: code ?? 1, output }))
        .catch(reject);
    });
  });
}

function ensureBranchAlignment() {
  const currentBranch = runCapture("git", ["branch", "--show-current"]);

  if (currentBranch !== targetBranch) {
    fail(
      [
        `Lovable is expected to sync from "${targetBranch}", but this checkout is on "${currentBranch}".`,
        `Switch or merge onto "${targetBranch}" before pushing preview-bound changes.`,
        `Tip: git switch ${targetBranch}`,
      ].join("\n"),
    );
  }

  return currentBranch;
}

async function runBuild() {
  const logsDir = path.join(cwd, ".lovable", "logs");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(logsDir, `build-${timestamp}.log`);

  await mkdir(logsDir, { recursive: true });

  console.log(`\n[lovable] Running production build check...`);
  const result = await runStreaming("npm", ["run", "build"], { logFile });

  if (result.code !== 0) {
    fail(`Build failed. Review ${path.relative(cwd, logFile)} before retrying.`);
  }

  console.log(`[lovable] Build passed. Log saved to ${path.relative(cwd, logFile)}.`);
  return logFile;
}

function printStatus() {
  const currentBranch = runCapture("git", ["branch", "--show-current"]);
  const head = runCapture("git", ["rev-parse", "--short", "HEAD"]);
  const workingTree = runCapture("git", ["status", "--porcelain", "--branch"]);
  const statusLines = workingTree.split("\n").filter(Boolean);
  const isAligned = currentBranch === targetBranch ? "yes" : "no";
  const isDirty = statusLines.length > 1 ? "dirty" : "clean";

  console.log("\nLovable Preview Status");
  console.log(`- target branch: ${targetBranch}`);
  console.log(`- current branch: ${currentBranch}`);
  console.log(`- branch aligned: ${isAligned}`);
  console.log(`- working tree: ${isDirty}`);
  console.log(`- HEAD: ${head}`);
  console.log(`- git status: ${statusLines[0] ?? "## HEAD (detached)"}`);
  console.log(`- next sync: npm run lovable:sync -- --message "Describe the change"`);
  console.log(`- force rebuild: npm run lovable:rebuild -- --message "trigger rebuild"`);
}

async function syncPreview({ message, allowEmpty }) {
  ensureBranchAlignment();
  await runBuild();

  console.log(`\n[lovable] Staging changes...`);
  const addResult = await runStreaming("git", ["add", "-A"]);
  if (addResult.code !== 0) {
    fail("git add failed.");
  }

  const hasStagedChanges = runStatus("git", ["diff", "--cached", "--quiet"]) !== 0;
  if (!hasStagedChanges && !allowEmpty) {
    console.log("\n[lovable] No staged changes to sync.");
    console.log("[lovable] Use npm run lovable:rebuild -- --message \"trigger rebuild\" to force a preview refresh.");
    return;
  }

  console.log(`\n[lovable] Creating commit...`);
  const commitArgs = ["commit", "-m", message];
  if (allowEmpty) {
    commitArgs.splice(1, 0, "--allow-empty");
  }

  const commitResult = await runStreaming("git", commitArgs);
  if (commitResult.code !== 0) {
    fail("git commit failed.");
  }

  console.log(`\n[lovable] Pushing ${targetBranch} to origin...`);
  const pushResult = await runStreaming("git", ["push", "origin", targetBranch]);
  if (pushResult.code !== 0) {
    fail("git push failed.");
  }

  const head = runCapture("git", ["rev-parse", "--short", "HEAD"]);
  console.log(`\n[lovable] Sync complete for ${targetBranch} at ${head}.`);
  console.log("[lovable] If Lovable still shows stale UI after the deploy completes, hard refresh the preview.");
}

function printHelp() {
  console.log(`
Usage:
  npm run lovable:status
  npm run lovable:sync -- --message "Describe the change"
  npm run lovable:rebuild -- --message "trigger rebuild"

Notes:
  - The sync commands require the current branch to match LOVABLE_BRANCH (default: main).
  - lovable:sync blocks commits when the production build fails.
  - lovable:rebuild creates an empty commit when needed to force a fresh deploy cycle.
`.trim());
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    printHelp();
    return;
  }

  if (command === "status") {
    printStatus();
    return;
  }

  if (command === "sync" || command === "rebuild") {
    await syncPreview({
      message: options.message,
      allowEmpty: options.allowEmpty || command === "rebuild",
    });
    return;
  }

  fail(`Unknown command: ${command}`);
}

main().catch((error) => fail(error.message));
