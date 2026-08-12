const BOOK_TABLE_COLUMNS = {
  title: "书名",
  author: "作者",
  image: "封面图片",
  color: "主色",
  ink: "文字色",
  spine: "书脊颜色",
  spineInk: "书脊文字色",
  width: "封面宽度",
  height: "书架高度",
  spineWidth: "书脊宽度",
  coverRatio: "封面比例",
  shelfGap: "书架间距",
  detailColor: "详情背景色",
  descriptionOne: "简介一",
  descriptionTwo: "简介二",
};

const BOOK_DEFAULTS = {
  color: "#dededb",
  ink: "#211f1c",
  width: 272,
  height: 0.92,
  spineWidth: 42,
  coverRatio: 2 / 3,
  shelfGap: 14,
};

function parseNumber(value, fallback) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return fallback;

  const ratio = normalized.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  const parsed = ratio && Number(ratio[2]) !== 0
    ? Number(ratio[1]) / Number(ratio[2])
    : Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeImage(value) {
  const image = String(value ?? "").trim();
  if (!image) return "";
  if (/^(?:\.\.?\/|https?:\/\/|\/)/i.test(image)) return image;
  return `./assets/covers/${image}`;
}

function parseBooksTable(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("books.tsv does not contain any books.");

  const headers = lines.shift().split("\t").map((header) => header.trim());
  const requiredHeaders = Object.values(BOOK_TABLE_COLUMNS);
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`books.tsv is missing columns: ${missingHeaders.join(", ")}`);
  }

  return lines.map((line, index) => {
    const values = line.split("\t");
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex] ?? ""]));
    const read = (key) => String(record[BOOK_TABLE_COLUMNS[key]] ?? "").trim();
    const title = read("title");
    const author = read("author");
    const image = normalizeImage(read("image"));

    if (!title || !author || !image) {
      throw new Error(`books.tsv row ${index + 2} requires 书名, 作者 and 封面图片.`);
    }

    const color = read("color") || BOOK_DEFAULTS.color;
    const ink = read("ink") || BOOK_DEFAULTS.ink;
    const book = {
      title,
      author,
      image,
      originalCover: true,
      color,
      ink,
      spine: read("spine") || color,
      spineInk: read("spineInk") || ink,
      width: parseNumber(read("width"), BOOK_DEFAULTS.width),
      height: parseNumber(read("height"), BOOK_DEFAULTS.height),
      spineWidth: parseNumber(read("spineWidth"), BOOK_DEFAULTS.spineWidth),
      coverRatio: parseNumber(read("coverRatio"), BOOK_DEFAULTS.coverRatio),
      shelfGap: parseNumber(read("shelfGap"), BOOK_DEFAULTS.shelfGap),
      description: [read("descriptionOne"), read("descriptionTwo")].filter(Boolean),
    };

    const detailColor = read("detailColor");
    if (detailColor) book.detailColor = detailColor;
    return book;
  });
}

window.BROOKE_BOOKS_READY = fetch("./books.tsv", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error(`Unable to load books.tsv: ${response.status}`);
    return response.text();
  })
  .then((text) => {
    const books = parseBooksTable(text);
    window.BROOKE_BOOKS = books;
    window.BROOKE_SHELF_GAPS = books.map((book) => book.shelfGap);
    return books;
  });
