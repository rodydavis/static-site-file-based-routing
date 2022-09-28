import * as fs from "fs";
import * as path from "path";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import * as parse5 from "parse5";
import type { Document } from "parse5/dist/tree-adapters/default.js";
import format from 'html-format';

function compile(file: string) {
    const raw = fs.readFileSync(file, "utf-8");
    const ext = path.extname(file);

    switch (ext) {
        case ".md":
        case ".markdown":
            const md = new MarkdownIt({
                html: true,
                linkify: true,
                typographer: true,
                highlight: function (str, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return (
                                '<pre class="hljs"><code>' +
                                hljs.highlight(str, { language: lang, ignoreIllegals: true })
                                    .value +
                                "</code></pre>"
                            );
                        } catch (__) {
                            console.error(__);
                        }
                    }
                    return "";
                },
            });
            return parse5.parse(md.render(raw));
        case ".html":
            return parse5.parse(raw);
        default:
            break;
    }

    return raw;
}

const HTML = (options?: { head?: string; body?: string }) => `
<!DOCTYPE html>
<html lang="en">
<head>
${options?.head ?? ""}
</head>
<body>
${options?.body ?? "<slot></slot>"}
</body>
</html>
`;

export async function compileFile(file: string, target: string) {
    // Use regex to check if ends with index.*
    const isIndex = /index\.([a-z]+)$/i.test(file);

    if (!isIndex && !fs.statSync(file).isDirectory()) {
        // Skipping for nested layouts
        return;
    }

    const parent = path.dirname(target);

    // Render up the directory tree until we hit the root directory
    const files: string[] = [file];
    let filePath = file;
    while (filePath !== parent) {
        filePath = path.dirname(filePath);
        // Check for root level layout
        const layout = path.join(filePath, "layout.html");
        if (fs.existsSync(layout)) {
            files.unshift(layout);
        }
        if (filePath === ".") break;
    }

    // Check for root level index markdown or html
    const layout = path.join(parent, "layout.html");
    if (fs.existsSync(layout)) {
        if (
            fs.existsSync(path.join(parent, "index.html")) ||
            fs.existsSync(path.join(parent, "index.md")) ||
            fs.existsSync(path.join(parent, "index.markdown"))
        ) {
            files.unshift(layout);
        }
    }

    let output = HTML();

    for (const item of files) {
        const doc = compile(item);
        if (typeof doc !== 'string') {
            const content = parse5.serialize(doc);
            output = mergeDocuments(output, content);
        }
    }

    // Replace extension
    const ext = path.extname(file);
    const newFile = target.replace(ext, '.html');

    // Check if parent directory exists
    const parentDir = path.dirname(newFile);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(newFile, output);
    console.log(`--> ${newFile}`);
}

function mergeDocuments(current: string, source: string) {
    let raw = current;

    // Merge body
    const html = extractDoc(parse5.parse(source));
    // Check for <slot></slot>
    const hasSlot = raw.includes("<slot></slot>");
    if (hasSlot) {
        raw = raw.replace("<slot></slot>", parse5.serialize(html.body));
    } else {
        // Append to body
        const endBodyIdx = raw.lastIndexOf("</body>");
        const start = raw.slice(0, endBodyIdx);
        const end = raw.slice(endBodyIdx);
        const body = parse5.serialize(html.body);
        raw = start + body + end;
    }

    // Merge head
    const endHeadIdx = raw.lastIndexOf("</head>");
    const start = raw.slice(0, endHeadIdx);
    const end = raw.slice(endHeadIdx);
    const head = parse5.serialize(html.head);
    raw = start + head + end;

    // Format
    raw = format(raw);

    // Remove duplicate title tags
    const lastTitle = raw.lastIndexOf("<title>");
    const lastTitleEnd = raw.lastIndexOf("</title>");
    const title = raw.slice(lastTitle, lastTitleEnd + 8);
    raw = raw.replace(/<title>.*<\/title>/, "");
    raw = raw.replace("</head>", title + "</head>");

    return raw;
}

function extractDoc(doc: Document) {
    const html = (doc.childNodes[1] ?? doc.childNodes[0]) as unknown as Document;
    const head = html.childNodes.find(
        (node) => node.nodeName === "head"
    ) as unknown as Document;
    const body = html.childNodes.find(
        (node) => node.nodeName === "body"
    ) as unknown as Document;
    return { head, body };
}

export async function compileDir(inputDir: string, outputDir: string) {
    const files = fs.readdirSync(inputDir);
    for (const file of files) {
        const inputFile = `${inputDir}/${file}`;
        const outputFile = `${outputDir}/${file}`;

        await compileTarget(inputFile, outputFile);
    }
}

export async function compileTarget(input: string, output: string) {
    const stat = fs.statSync(input);
    if (stat.isDirectory()) {
        if (!fs.existsSync(output)) {
            fs.mkdirSync(output, { recursive: true });
        }
        await compileDir(input, output);
    } else if (stat.isFile()) {
        const ext = path.extname(input);
        if (['.html', '.md', '.markdown'].includes(ext)) {
            await compileFile(input, output);
        } else {
            // Check if content is the same
            const current = fs.readFileSync(input, 'utf-8');
            const previous = fs.readFileSync(output, 'utf-8');
            if (current !== previous) {
                fs.writeFileSync(output, current);
            }
        }
    }
}
