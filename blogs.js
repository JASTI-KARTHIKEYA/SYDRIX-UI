// Blogs page: load posts from a public Google Sheet (no deployment changes needed)

// 1. Set up your Google Sheet (see README notes or assistant instructions):
//    - Row 1: headers exactly as below (case-sensitive):
//        Status | Slug | Type | Title | Date | Category | Excerpt | Content | Image URL
//    - Each next row is one blog post.
//    - "Status" should be "Published" for posts that should appear on the site.
//    - "Type" can be "text" or "image".
//
// 2. Publish the sheet:
//    - File → Share → Publish to web → choose the sheet/tab → format = Web page (or leave default).
//    - Copy the sheet ID and gid from the URL.
//
// 3. This file is configured to read the published TSV (tab-separated) output of the sheet.
//    For your sheet we use the public "pub?output=tsv" endpoint derived from the pubhtml link.

const BLOG_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPZwJ-KyNCfIvMhUykRxUPIQbA3j4BAWkNOwTh45ARlRjFklaVpY-EnHzFGyjBN_ben7npn_yLFxNb/pub?gid=0&single=true&output=tsv";

async function initBlogsPage() {
  const container = document.getElementById("blogsContainer");
  const loadingEl = document.getElementById("blogsLoading");
  const errorEl = document.getElementById("blogsError");

  if (!container) return; // Not on the blogs page

  try {
    await loadBlogs(container, loadingEl, errorEl);
  } catch (error) {
    console.error("Error initialising blogs page", error);
  }
}

async function loadBlogs(container, loadingEl, errorEl) {
  try {
    const response = await fetch(BLOG_SHEET_URL);

    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    const text = await response.text();
    const table = parseSheetTableFromTsv(text);
    const sheetRows = tableToObjects(table);
    const posts = mapSheetRowsToPosts(sheetRows);

    if (loadingEl) {
      loadingEl.remove();
    }

    if (!posts.length) {
      const emptyEl = document.createElement("p");
      emptyEl.className = "blog-loading";
      emptyEl.textContent = "No blogs published yet.";
      container.appendChild(emptyEl);
      return;
    }

    renderBlogCards(container, posts);
  } catch (error) {
    console.error("Error loading blogs", error);

    if (loadingEl) {
      loadingEl.remove();
    }

    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = "Unable to load blogs right now. Please try again later.";
    }
  }
}
// Parse TSV (tab-separated values) text into a simple table { headers: string[], rows: string[][] }
function parseSheetTableFromTsv(text) {
  if (!text) return { headers: [], rows: [] };

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (!lines.length) return { headers: [], rows: [] };

  const rawRows = lines.map((line) => line.split("\t"));
  const headers = rawRows[0].map((h) => h.trim());
  const dataRows = rawRows.slice(1);

  return { headers, rows: dataRows };
}

// Convert the parsed table to an array of objects keyed by header labels
function tableToObjects(table) {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) return [];

  const headers = table.headers;

  return table.rows.map((row) => {
    const obj = {};

    headers.forEach((header, index) => {
      const key = (header || ``).trim();
      if (!key) return;
      const value = row[index] != null ? row[index] : "";
      obj[key] = value.toString();
    });

    return obj;
  });
}

// Normalise sheet rows into blog posts and filter only published ones
function mapSheetRowsToPosts(rows) {
  return rows
    .map((raw, index) => {
      const status = (raw["Status"] || "").toString().trim().toLowerCase();
      const type = (raw["Type"] || "text").toString().trim().toLowerCase();
      const dateRaw = (raw["Date"] || raw["Data"] || "").toString().trim();

      // Decode any literal "\n" sequences from the sheet into real newlines
      const rawExcerpt = (raw["Excerpt"] || "").toString().trim();
      const rawContent = (raw["Content"] || "").toString().trim();

      const excerpt = rawExcerpt.replace(/\\n/g, "\n");
      const content = rawContent.replace(/\\n/g, "\n");

      return {
        index,
        status,
        type: type === "image" ? "image" : "text",
        slug: (raw["Slug"] || "").toString().trim(),
        title: (raw["Title"] || "").toString().trim(),
        dateText: dateRaw,
        category: (raw["Category"] || "").toString().trim(),
        excerpt,
        content,
        imageUrl: (raw["Image URL"] || "").toString().trim(),
      };
    })
    .filter((post) => post.status === "published")
    .sort((a, b) => b.index - a.index); // newest rows (bottom of sheet) first
}

function renderBlogCards(container, posts) {
  posts.forEach((post) => {
    const link = document.createElement("a");
    link.className = "blog-card-link reveal";

    if (post.slug) {
      link.href = `blog.html?slug=${encodeURIComponent(post.slug)}`;
      console.log("Creating card for:", post.title, "with slug:", post.slug, "URL:", link.href);
    } else {
      link.href = "#";
      link.setAttribute("aria-disabled", "true");
    }

    const card = document.createElement("article");
    card.className = "blog-card";

    // Meta row (category + date)
    const meta = document.createElement("div");
    meta.className = "blog-meta";

    if (post.category) {
      const tagEl = document.createElement("span");
      tagEl.className = "blog-tag";
      tagEl.textContent = post.category;
      meta.appendChild(tagEl);
    }

    if (post.dateText) {
      const dateEl = document.createElement("span");
      dateEl.className = "blog-date";
      dateEl.textContent = post.dateText;
      meta.appendChild(dateEl);
    }

    if (meta.children.length) {
      card.appendChild(meta);
    }

    // Optional image on top for image posts
    if (post.type === "image" && post.imageUrl) {
      const img = document.createElement("img");
      img.className = "blog-card__image";
      img.src = post.imageUrl;
      img.alt = post.title || "Blog image";
      card.appendChild(img);
    }

    // Title
    if (post.title) {
      const titleEl = document.createElement("h3");
      titleEl.className = "blog-title";
      titleEl.textContent = post.title;
      card.appendChild(titleEl);
    }

    // Excerpt
    if (post.excerpt) {
      const excerptEl = document.createElement("p");
      excerptEl.className = "blog-excerpt";
      excerptEl.textContent = post.excerpt;
      card.appendChild(excerptEl);
    }

    const footer = document.createElement("div");
    footer.className = "blog-card-footer";

    const readMore = document.createElement("span");
    readMore.className = "blog-read-more";
    readMore.textContent = "Read full article";

    footer.appendChild(readMore);
    card.appendChild(footer);

    link.appendChild(card);
    container.appendChild(link);

    // Hook into existing reveal animation if available
    try {
      if (typeof revealObserver !== "undefined" && revealObserver && revealObserver.observe) {
        revealObserver.observe(link);
      }
    } catch (e) {
      // Ignore if revealObserver is not defined for some reason
    }
  });
}

// Because this script is loaded with `defer`, DOM is ready when this runs
document.addEventListener("DOMContentLoaded", initBlogsPage);
