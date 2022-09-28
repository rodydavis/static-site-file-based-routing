import * as fs from "fs";
import { compileDir, compileTarget } from "./compile.js";
import * as path from "path";
import chokidar from "chokidar";
import { publicDirectory } from "./static.js";

interface Options {
    inputDir?: string;
    outputDir?: string;
    publicDir?: string;
    watch?: boolean;
    clean?: boolean;
}

export default async function build(options: Options) {
    const inputDir = options.inputDir || "www";
    const outputDir = options.outputDir || "build";
    const publicDir = options.publicDir || "public";
    const watch = options.watch || false;
    const clean = options.clean || false;

    if (!fs.existsSync(inputDir)) {
        throw new Error(`Input directory ${inputDir} does not exist`);
    }

    if (clean) {
        if (fs.existsSync(outputDir)) {
            fs.rmdirSync(outputDir, { recursive: true });
        }
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    if (watch) {
        console.log("Watching for changes...");
        chokidar.watch(inputDir).on("all", async (event, inputFile) => {
            console.log(event, inputFile);
            if (fs.existsSync(inputFile)) {
                const relativePath = path.relative(inputDir, inputFile);
                const outputFile = `${outputDir}/${relativePath}`;

                const stat = fs.statSync(inputFile);
                if (stat.isDirectory()) {
                    await compileDir(inputFile, outputFile);
                } else if (stat.isFile()) {
                    const filename = path.basename(inputFile);
                    if (filename === "layout.html") {
                        // Rebuild all related directories
                        const dir = path.dirname(inputFile);
                        const inDir = path.relative(inputDir, dir);
                        const outDir = `${outputDir}/${inDir}`;
                        await compileDir(dir, outDir);
                    } else {
                        await compileTarget(inputFile, outputFile);
                    }
                }
            }
        });
    } else {
        await compileDir(inputDir, outputDir);
    }

    if (publicDir.split(',').length > 1) {
        for (const dir of publicDir.split(',')) {
            publicDirectory(dir, outputDir, watch);
        }
    } else {
        publicDirectory(publicDir, outputDir, watch);
    }
}
