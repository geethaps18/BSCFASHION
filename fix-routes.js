import fs from "fs";
import path from "path";

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (file === "route.ts") {
      results.push(fullPath);
    }
  });

  return results;
}

const routes = walk("./app/api");

routes.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  content = content
    .replace(
      /GET\s*\([\s\S]*?context:\s*{ params:\s*{ id:\s*string }\s* }/,
      "GET(req, { params }: { params: Promise<{ id: string }> })"
    )
    .replace(
      /GET\s*\([\s\S]*?context:\s*{ params:\s*{ orderId:\s*string }\s* }/,
      "GET(req, { params }: { params: Promise<{ orderId: string }> })"
    )
    .replace(
      /GET\s*\([\s\S]*?context:\s*{ params:\s*{ productId:\s*string }\s* }/,
      "GET(req, { params }: { params: Promise<{ productId: string }> })"
    );

  fs.writeFileSync(file, content);
  console.log("Fixed:", file);
});
