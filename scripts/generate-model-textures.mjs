import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const toolDirectory = path.join(
  root,
  ".cache",
  "realcugan",
  "tool",
  "realcugan-ncnn-vulkan-20220728-windows",
);
const executable = process.env.REALCUGAN_PATH ?? path.join(
  toolDirectory,
  "realcugan-ncnn-vulkan.exe",
);
const modelPath = process.env.REALCUGAN_MODEL_PATH ?? path.join(toolDirectory, "models-se");
const sourceDirectory = path.join(root, "local-assets", "original", "model");
const pages = ["CH0233_home.png", "CH0233_home2.png", "CH0233_home3.png"];

function run(arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Real-CUGAN exited with code ${code}`));
    });
  });
}

for (const [tier, scale] of [["4k", 2], ["8k", 4]]) {
  const outputDirectory = path.join(root, "generated-assets", `model-${tier}`);
  await mkdir(outputDirectory, { recursive: true });
  for (const page of pages) {
    await run([
      "-i", path.join(sourceDirectory, page),
      "-o", path.join(outputDirectory, page),
      "-s", String(scale),
      "-n", "-1",
      "-m", modelPath,
    ]);
  }
}

console.log("Generated 4K and 8K Hare model texture tiers with Real-CUGAN.");
