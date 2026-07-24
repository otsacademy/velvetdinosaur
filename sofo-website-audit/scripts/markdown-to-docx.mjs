import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import fs from "node:fs/promises";
import path from "node:path";

const inputPath = path.resolve(process.argv[2] || "sofo-website-audit/output/sofo-website-audit.md");
const outputPath = path.resolve(process.argv[3] || "sofo-website-audit/output/sofo-website-audit.docx");

function cleanInline(value) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function textParagraph(text, options = {}) {
  return new Paragraph({
    ...options,
    children: [new TextRun({ text: cleanInline(text), size: options.size || 22 })],
    spacing: { before: options.before ?? 80, after: options.after ?? 80, line: 276 },
  });
}

function heading(text, level) {
  const map = {
    1: HeadingLevel.TITLE,
    2: HeadingLevel.HEADING_1,
    3: HeadingLevel.HEADING_2,
    4: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    text: cleanInline(text),
    heading: map[level] || HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 120 : 260, after: 100 },
  });
}

function parseTable(lines) {
  const rows = lines.filter((line) => !/^\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((line, index) => {
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cleanInline(cell));
      return new TableRow({
        tableHeader: index === 0,
        children: cells.map(
          (cell) =>
            new TableCell({
              margins: { top: 90, bottom: 90, left: 90, right: 90 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, bold: index === 0, size: 19 })],
                  spacing: { after: 0 },
                }),
              ],
            })
        ),
      });
    }),
  });
}

function flushParagraph(buffer, children) {
  if (buffer.length === 0) return;
  children.push(textParagraph(buffer.join(" ")));
  buffer.length = 0;
}

async function main() {
  const markdown = await fs.readFile(inputPath, "utf8");
  const lines = markdown.split(/\r?\n/);
  const children = [];
  const paragraphBuffer = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      flushParagraph(paragraphBuffer, children);
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(paragraphBuffer, children);
      children.push(heading(headingMatch[2], headingMatch[1].length));
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph(paragraphBuffer, children);
      const tableLines = [line.trim()];
      while (/^\|.+\|$/.test(lines[index + 1]?.trim() || "")) {
        index += 1;
        tableLines.push(lines[index].trim());
      }
      children.push(parseTable(tableLines));
      children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph(paragraphBuffer, children);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanInline(bulletMatch[1]), size: 21 })],
          bullet: { level: 0 },
          spacing: { before: 30, after: 30, line: 276 },
        })
      );
      continue;
    }

    const numberMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      flushParagraph(paragraphBuffer, children);
      children.push(textParagraph(`${numberMatch[1]}. ${numberMatch[2]}`, { before: 30, after: 30 }));
      continue;
    }

    paragraphBuffer.push(line.trim());
  }
  flushParagraph(paragraphBuffer, children);

  const doc = new Document({
    creator: "Velvet Dinosaur",
    title: "Practical Website Audit for Soldiers of Oxfordshire Museum",
    description: "Editable website audit report for review",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          new Paragraph({
            text: " ",
            spacing: { before: 200, after: 200 },
            alignment: AlignmentType.CENTER,
          }),
          ...children,
        ],
      },
    ],
    styles: {
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 44, bold: true },
          paragraph: { spacing: { after: 260 } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 32, bold: true },
          paragraph: { spacing: { before: 360, after: 140 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 26, bold: true },
          paragraph: { spacing: { before: 280, after: 100 } },
        },
      ],
    },
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
