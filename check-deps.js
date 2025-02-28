// Save this to a file like 'check-deps.js' and run with node
const { execSync } = require("child_process");

// Run npm ls to check dependencies
try {
  console.log("Checking for html-webpack-plugin dependencies:");
  const output = execSync("npm ls html-webpack-plugin", { encoding: "utf8" });
  console.log(output);
} catch (error) {
  // npm ls returns non-zero exit code if dependency is missing, which is expected
  console.log(error.stdout);
}
