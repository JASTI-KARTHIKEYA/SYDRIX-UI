// Blog detail page: load a single post from the same public Google Sheet used on blogs.html

// BLOG_SHEET_URL is defined in blogs.js so both list and detail pages use the same live sheet
async function initBlogDetailPage() {
  const articleEl = document.getElementById("blogArticle");
  const titleEl = document.getElementById("blogTitle");
  const metaEl = document.getElementById("blogMeta");
  const categoryKickerEl = document.getElementById("blogCategoryKicker");

  if (!articleEl || !titleEl || !metaEl) return;

  try {
    metaEl.textContent = "Loading article…";

    const response = await fetch(BLOG_SHEET_URL);

    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    const text = await response.text();
    const table = parseSheetTableFromTsv(text);
    const rows = tableToObjects(table);
    const posts = mapSheetRowsToPosts(rows);

    if (!posts.length) {
      titleEl.textContent = "No blogs available";
      metaEl.textContent = "There are no published blogs in the sheet yet.";
      articleEl.innerHTML =
        '<p class="blog-error">Once a blog is published in the sheet it will appear here automatically.</p>';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    let slug = (params.get("slug") || "").trim();
    let post;

    console.log("Looking for slug:", slug);
    console.log("Available posts:", posts.map(p => ({ slug: p.slug, title: p.title })));

    if (slug) {
      post = posts.find((p) => p.slug === slug);
      console.log("Found post:", post ? post.title : "NOT FOUND");
    } else {
      // If no slug is provided, show the latest blog by default
      post = posts[0];
      slug = post.slug;
      if (slug) {
        params.set("slug", slug);
        const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash || ""}`;
        window.history.replaceState({}, "", newUrl);
      }
    }

    if (!post) {
      titleEl.textContent = "Blog not found";
      metaEl.textContent = "We couldn't find a blog matching this link.";
      articleEl.innerHTML =
        '<p class="blog-error">This blog may have been unpublished. Please return to the <a href="blogs.html#blogs">blogs page</a>.</p>';
      return;
    }

    // Update hero
    if (categoryKickerEl) {
      categoryKickerEl.textContent = post.category || "Blog";
    }

    titleEl.textContent = post.title || "Blog article";
    metaEl.textContent = post.dateText || "";

    renderPostDetail(articleEl, post);
  } catch (error) {
    console.error("Error loading blog detail", error);
    titleEl.textContent = "Unable to load blog";
    metaEl.textContent = "Please try again later.";
    articleEl.innerHTML =
      '<p class="blog-error">We couldn\'t load this blog right now. Please try again later or go back to the <a href="blogs.html#blogs">blogs page</a>.</p>';
  }
}

function renderPostDetail(container, post) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "blog-detail-inner";

  // Optional hero image
  if (post.type === "image" && post.imageUrl) {
    const img = document.createElement("img");
    img.className = "blog-detail-image";
    img.src = post.imageUrl;
    img.alt = post.title || "Blog image";
    wrapper.appendChild(img);
  }

  // Meta row (category + date)
  const meta = document.createElement("div");
  meta.className = "blog-meta blog-detail-meta";

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
    wrapper.appendChild(meta);
  }

  // Lead / excerpt (single compact intro paragraph)
  if (post.excerpt) {
    const lead = document.createElement("p");
    lead.className = "blog-detail-lead";

    const rawExcerpt = (post.excerpt || "").toString();
    const decodedExcerpt = rawExcerpt.replace(/\\n/g, "\n");
    const singleLineExcerpt = decodedExcerpt.replace(/\s*\n\s*/g, " ").trim();
    lead.innerHTML = formatBlogHtml(singleLineExcerpt);

    wrapper.appendChild(lead);
  }

  // Main content: parse into paragraphs and bullet lists using newlines
  if (post.content) {
    const body = document.createElement("div");
    body.className = "blog-detail-body";

    const rawContent = (post.content || "").toString();
    const decodedContent = rawContent.replace(/\\n/g, "\n");

    const blocks = parseContentBlocks(decodedContent);

    blocks.forEach((block) => {
      if (block.type === "paragraph") {
        const p = document.createElement("p");
        p.innerHTML = formatBlogHtml(block.text);
        body.appendChild(p);
      } else if (block.type === "list" && Array.isArray(block.items) && block.items.length) {
        const ul = document.createElement("ul");
        block.items.forEach((item) => {
          const li = document.createElement("li");
          li.innerHTML = formatBlogHtml(item);
          ul.appendChild(li);
        });
        body.appendChild(ul);
      }
    });

    wrapper.appendChild(body);
  }

  const backLink = document.createElement("a");
  backLink.href = "blogs.html#blogs";
  backLink.className = "blog-back-link";
  backLink.textContent = "Back to all blogs";

  container.appendChild(wrapper);
  container.appendChild(backLink);
}

function formatBlogHtml(text) {
  if (!text) return "";

  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Keep newlines as-is; CSS white-space: pre-wrap will render them
  return escaped;
}


function parseContentBlocks(text) {
  if (!text) return [];

  // Normalise any real newlines to spaces
  let normalised = text.replace(/\r?\n/g, " ");
  // Collapse runs of 3+ spaces down to 2 so we can treat "  " as a separator
  normalised = normalised.replace(/ {3,}/g, "  ");

  // Split on double spaces, which in your content separate sections and bullet blocks
  const rawSegments = normalised.split(/ {2}/g).map((s) => s.trim()).filter(Boolean);

  const blocks = [];
  let currentList = null;

  function flushList() {
    if (currentList && currentList.items.length) {
      blocks.push(currentList);
    }
    currentList = null;
  }

  rawSegments.forEach((seg) => {
    if (!seg) return;

    // If this segment contains bullet markers anywhere, split them out
    if (seg.includes("\u2022") || /^-\s+/.test(seg)) {
      const bulletIndex = seg.indexOf("\u2022") !== -1 ? seg.indexOf("\u2022") : seg.search(/-\s+/);

      // Intro text before first bullet 
      if (bulletIndex > 0) {
        const intro = seg.slice(0, bulletIndex).trim();
        if (intro) {
          flushList();
          blocks.push({ type: "paragraph", text: intro });
        }
      }

      const bulletPart = bulletIndex >= 0 ? seg.slice(bulletIndex) : seg;
      const items = bulletPart
        .split(/[\u2022-]\s+/g)
        .map((s) => s.trim())
        .filter(Boolean);

      if (items.length) {
        flushList();
        currentList = { type: "list", items: [] };
        items.forEach((item) => currentList.items.push(item));
      }
      return;
    }

    // Plain text segment 
    flushList();
    blocks.push({ type: "paragraph", text: seg });
  });

  flushList();
  return blocks;
}

// Parsing helpers (same structure as blogs.js)
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

function mapSheetRowsToPosts(rows) {
  return rows
    .map((raw, index) => {
      const status = (raw["Status"] || "").toString().trim().toLowerCase();
      const type = (raw["Type"] || "text").toString().trim().toLowerCase();
      const dateRaw = (raw["Date"] || raw["Data"] || "").toString().trim();

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
    .sort((a, b) => b.index - a.index);
}

document.addEventListener("DOMContentLoaded", initBlogDetailPage);
