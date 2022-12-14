#!/usr/bin/env node

// @ts-ignore
import { parseArgs } from "@pkgjs/parseargs";
import build from "./build.js";

export async function main() {
  const {
    values: { inputDir, outputDir, watch },
  } = parseArgs({
    options: {
      inputDir: {
        type: "string",
        short: "i",
      },
      outputDir: {
        type: "string",
        short: "o",
      },
      watch: {
        type: "boolean",
        short: "w",
      },
    },
    allowPositional: true,
  });

  if (inputDir === undefined || outputDir === undefined) {
    console.log("Usage: build -i <inputDir> -o <outputDir> [-w]");
    return;
  }

  await build({
    inputDir,
    outputDir,
    watch,
  });
}

main();
