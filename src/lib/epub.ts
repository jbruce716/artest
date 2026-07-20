import AdmZip from "adm-zip";
import * as cheerio from "cheerio";
import path from "path";

export interface Chapter {
  number: number;
  title: string;
  text: string;
  charCount: number;
}

export function extractChaptersFromEpub(epubBuffer: Buffer): Chapter[] {
  const zip = new AdmZip(epubBuffer);
  const entries = zip.getEntries();

  // Find content.opf (could be at various paths)
  const opfEntry = entries.find((e) => e.entryName.endsWith(".opf"));
  if (!opfEntry) {
    throw new Error("No .opf file found in EPUB");
  }

  const opfContent = opfEntry.getData().toString("utf-8");
  const opfDir = path.dirname(opfEntry.entryName);

  // Parse OPF to get spine order + manifest (idref → href mapping)
  const opf = cheerio.load(opfContent, { xmlMode: true });

  // Build manifest: id → href
  const manifest = new Map<string, string>();
  opf("manifest item").each((_, el) => {
    const id = opf(el).attr("id");
    const href = opf(el).attr("href");
    if (id && href) manifest.set(id, href);
  });

  // Get spine order (reading order)
  const spineItemrefs: string[] = [];
  opf("spine itemref").each((_, el) => {
    const idref = opf(el).attr("idref");
    if (idref) spineItemrefs.push(idref);
  });

  // Extract text from each spine item in order
  const chapters: Chapter[] = [];
  let chapterNum = 0;

  for (const idref of spineItemrefs) {
    const href = manifest.get(idref);
    if (!href) continue;

    // Resolve path relative to OPF directory
    const fullPath = path.normalize(path.join(opfDir, href));
    const entry = entries.find(
      (e) => e.entryName === fullPath || e.entryName.endsWith("/" + fullPath)
    );
    if (!entry) continue;

    const html = entry.getData().toString("utf-8");
    const $ = cheerio.load(html);

    // Try to find chapter title
    let title = $("h1, h2, h3, title").first().text().trim();
    if (!title) title = `Chapter ${chapterNum + 1}`;

    // Strip tags, get text
    $("script, style, nav, head").remove();
    const text = $("body").text()
      .replace(/\s+/g, " ")
      .trim();

    // Skip empty or very short entries (cover pages, TOC, etc.)
    if (text.length < 200) continue;

    chapterNum++;
    chapters.push({
      number: chapterNum,
      title,
      text,
      charCount: text.length,
    });
  }

  return chapters;
}