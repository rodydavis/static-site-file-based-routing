import * as fs from "fs";
import * as path from "path";
import chokidar from "chokidar";

export function publicDirectory(publicDir: string, outputDir: string, watch: boolean) {
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