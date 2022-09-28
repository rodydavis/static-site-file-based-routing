import * as fs from "fs";
import { compileDir, compileFile } from "./compile.js";
import * as path from "path";
import chokidar from "chokidar";

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
                        await compileFile(inputFile, outputFile);
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

function publicDirectory(publicDir: string, outputDir: string, watch: boolean) {
    if (watch) {
        if (fs.existsSync(publicDir)) {
            chokidar.watch(publicDir).on("all", (event, inputFile) => {
                console.log(event, inputFile);
                if (fs.existsSync(inputFile)) {
                    const relativePath = path.relative(publicDir, inputFile);
                    const outputFile = `${outputDir}/${relativePath}`;

                    const stat = fs.statSync(inputFile);
                    if (stat.isDirectory()) {
                        copyStaticFiles(inputFile, outputFile);
                    } else if (stat.isFile()) {
                        fs.copyFileSync(inputFile, outputFile);
                    }
                }
            });
        }
    } else {
        // Copy static files
        if (fs.existsSync(publicDir)) {
            copyStaticFiles(publicDir, outputDir);
        }
    }
}

function copyStaticFiles(inDir: string, outDir: string) {
    const files = fs.readdirSync(inDir);
    for (const file of files) {
        const inputFile = `${inDir}/${file}`;
        const outputFile = `${outDir}/${file}`;

        const stat = fs.statSync(inputFile);
        if (stat.isDirectory()) {
            if (!fs.existsSync(outputFile)) {
                fs.mkdirSync(outputFile, { recursive: true });
            }

            copyStaticFiles(inputFile, outputFile);
        } else if (stat.isFile()) {
            fs.copyFileSync(inputFile, outputFile);
        }
    }
}