#!/usr/bin/env node

/**
 * Bootstrap script for Claude AI Chat Export Processor
 *
 * This script installs dependencies and sets up the basic environment.
 * It uses only Node.js built-in modules.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function makeFileExecutable(file) {
  try {
    fs.chmodSync(file, "755");
    console.log(`Made ${file} executable`);
  } catch (error) {
    console.warn(`Could not make ${file} executable: ${error.message}`);
  }
}

console.log("Claude AI Chat Export Processor - Bootstrap");
console.log("------------------------------------------");

// Create necessary directories
createDirIfNotExists("./data");
createDirIfNotExists("./output");

// Install dependencies
console.log("Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("Dependencies installed successfully.");
} catch (error) {
  console.error("Failed to install dependencies:", error.message);
  process.exit(1);
}

// Make scripts executable
makeFileExecutable("./index.js");
makeFileExecutable("./setup.js");

console.log("\nBootstrap complete!");
console.log("\nYou can now run the full setup script:");
console.log("node setup.js");
