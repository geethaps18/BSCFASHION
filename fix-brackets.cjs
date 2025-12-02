const fs = require("fs");
const path = require("path");

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Remove the wrong extra ")" before opening brace
  content = content.replace(
    /\)\s*\)\s*{/g,
    ") {"
  );

  // Also remove any lonely ") {" patterns
  content = content.replace(
    /\)\s*\){/g,
    ") {"
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Brackets fixed:", filePath);
}

function walk(folder) {
  const items = fs.readdirSync(folder);
  for (const item of items) {
    const full = path.join(folder, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (item === "route.ts") fixFile(full);
  }
}

walk("app/api");
