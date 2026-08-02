window.BROOKE_BOOKS_READY.then((books) => {
const shelfGaps = window.BROOKE_SHELF_GAPS;

const viewport = document.querySelector("#shelfViewport");
const track = document.querySelector("#booksTrack");
const activeTitle = document.querySelector("#activeTitle");
const activeNumber = document.querySelector("#activeNumber");
const totalBooks = document.querySelector("#totalBooks");
const previousBook = document.querySelector("#previousBook");
const nextBook = document.querySelector("#nextBook");
const library = document.querySelector(".library");
const masthead = document.querySelector(".masthead");
const shelfRegion = document.querySelector(".shelf-region");
const detail = document.querySelector("#bookDetail");
const detailClose = document.querySelector("#detailClose");
const detailReturn = document.querySelector("#detailReturn");
const detailBookShell = document.querySelector("#detailBookShell");
const detailFront = document.querySelector("#detailFront");
const detailCopy = document.querySelector("#detailCopy");
const detailNumber = document.querySelector("#detailNumber");
const detailTitle = document.querySelector("#detailTitle");
const detailAuthor = document.querySelector("#detailAuthor");
const detailDescription = document.querySelector("#detailDescription");

const bookElements = [];
let activeIndex = null;
let pinnedIndex = null;
let dragStartX = 0;
let dragStartScroll = 0;
let isDragging = false;
let hasDragged = false;
let pressedBookElement = null;
let didSetInitialScroll = false;
let detailIndex = null;
let detailOriginRect = null;
let detailOpenTimer = 0;
let detailCopyTimer = 0;
let detailSettleTimer = 0;
let detailCloseTimer = 0;

const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
}[character]));

function colorLuminance(value) {
  const normalized = String(value).trim().replace("#", "");
  const hex = normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function colorContrast(first, second) {
  const firstLuminance = colorLuminance(first);
  const secondLuminance = colorLuminance(second);
  if (firstLuminance === null || secondLuminance === null) return 0;
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableDetailInk(book) {
  const background = book.detailColor ?? book.color;
  if (colorContrast(background, book.ink) >= 4.5) return book.ink;
  if (colorContrast(background, book.spineInk) >= 4.5) return book.spineInk;
  const dark = "#161514";
  const light = "#f5f1e9";
  return colorContrast(background, dark) > colorContrast(background, light) ? dark : light;
}

function coverMarkup(book, index) {
  const safeTitle = escapeHtml(book.title);
  const safeAuthor = escapeHtml(book.author);
  if (book.originalCover && book.image) {
    return `<img class="cover-art cover-art--original" src="${book.image}" alt="" draggable="false" />`;
  }
  const coverArt = book.image
    ? `<img class="cover-art" src="${book.image}" alt="" draggable="false" />`
    : "";
  return `
    <span class="cover-series"><span>Selected pages</span><span>${String(index + 1).padStart(2, "0")}</span></span>
    <span class="cover-main">
      ${coverArt}
      <span class="cover-rule"></span>
      <span class="cover-title">${safeTitle}</span>
    </span>
    <span class="cover-author">${safeAuthor}</span>
  `;
}

function createBook(book, index) {
  const element = document.createElement("button");
  element.className = "book-slot";
  element.type = "button";
  element.dataset.index = String(index);
  element.dataset.openSide = "right";
  element.setAttribute("aria-label", `${book.title}, 作者：${book.author}`);
  element.setAttribute("aria-expanded", "false");
  element.setAttribute("aria-controls", "bookDetail");
  element.setAttribute("aria-haspopup", "dialog");
  element.style.setProperty("--book-width", `${book.width}px`);
  element.style.setProperty("--spine-width", `${book.spineWidth}px`);
  element.style.setProperty("--cover", book.color);
  element.style.setProperty("--cover-ink", book.ink);
  element.style.setProperty("--spine", book.spine);
  element.style.setProperty("--spine-ink", book.spineInk);
  element.style.setProperty("--art-opacity", String(book.opacity ?? 1));
  element.style.setProperty("--art-filter", book.filter ?? "none");

  const safeTitle = escapeHtml(book.title);
  element.innerHTML = `
    <span class="book-object" aria-hidden="true">
      <span class="book-back"></span>
      <span class="book-page-edge"></span>
      <span class="book-cover${book.originalCover ? " has-original-cover" : ""}">${coverMarkup(book, index)}</span>
    </span>
    <span class="book-spine" aria-hidden="true"><span class="spine-title">${safeTitle}</span></span>
  `;

  element.addEventListener("mouseenter", () => {
    if (isDragging || pinnedIndex !== null) return;
    openBook(index, false);
  });
  element.addEventListener("mouseleave", (event) => {
    if (pinnedIndex !== null) return;
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest(".book-slot") === element) return;
    closeBook(index);
  });
  element.addEventListener("focus", () => {
    if (pinnedIndex === null) openBook(index, false);
  });
  element.addEventListener("blur", () => {
    if (pinnedIndex === null) closeBook(index);
  });
  element.addEventListener("click", (event) => {
    if (hasDragged) {
      event.preventDefault();
      return;
    }
    pinnedIndex = index;
    const wasOpen = activeIndex === index && element.classList.contains("is-open");
    openBook(index, true);
    window.clearTimeout(detailOpenTimer);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailOpenTimer = window.setTimeout(() => {
      detailOpenTimer = 0;
      openBookDetail(index);
    }, prefersReducedMotion ? 20 : wasOpen ? 40 : 360);
  });

  track.append(element);
  bookElements.push(element);
}

function measureShelf() {
  const availableHeight = viewport.clientHeight;
  const maximumHeight = Math.max(260, Math.min(430, availableHeight - 8));
  let cursor = 0;
  books.forEach((book, index) => {
    const element = bookElements[index];
    element.style.setProperty("--book-height", `${Math.round(maximumHeight * book.height)}px`);
    element.style.setProperty("--x", `${cursor}px`);
    cursor += book.spineWidth + shelfGaps[index];
  });
  const sidePadding = Math.max(190, viewport.clientWidth * 0.38);
  track.style.setProperty("--track-pad", `${Math.ceil(sidePadding)}px`);
  track.style.setProperty("--track-width", `${Math.ceil(cursor + sidePadding * 2)}px`);
  if (activeIndex !== null) applyBookShifts(activeIndex);
  if (!didSetInitialScroll) {
    didSetInitialScroll = true;
    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
      viewport.scrollTop = 0;
    });
  }
}

function getOpenSide(index) {
  const element = bookElements[index];
  const bounds = element.getBoundingClientRect();
  const coverWidth = books[index].width;
  const leftRoom = bounds.left - viewport.getBoundingClientRect().left;
  const rightRoom = viewport.getBoundingClientRect().right - bounds.right;

  if (coverWidth + 24 > rightRoom && leftRoom > rightRoom) return "left";
  if (coverWidth + 24 > leftRoom && rightRoom >= leftRoom) return "right";
  return bounds.left + bounds.width / 2 > window.innerWidth / 2 ? "left" : "right";
}

function applyBookShifts(index) {
  const book = books[index];
  const openSide = bookElements[index].dataset.openSide;
  const extra = book.width - book.spineWidth;
  const beforeShift = openSide === "right" ? -extra * 0.34 : -extra * 0.68;
  const afterShift = openSide === "right" ? extra * 0.66 : extra * 0.32;

  bookElements.forEach((element, itemIndex) => {
    const shift = itemIndex < index ? beforeShift : itemIndex > index ? afterShift : 0;
    element.style.setProperty("--shift", `${Math.round(shift)}px`);
  });
}

function keepCoverInView(index) {
  const element = bookElements[index];
  const correctPosition = (behavior) => {
    if (!element.classList.contains("is-open") || detailIndex !== null) return;
    const object = element.querySelector(".book-object");
    const bounds = object.getBoundingClientRect();
    const viewBounds = viewport.getBoundingClientRect();
    const inset = 18;
    let delta = 0;
    if (bounds.left < viewBounds.left + inset) delta = bounds.left - viewBounds.left - inset;
    if (bounds.right > viewBounds.right - inset) delta = bounds.right - viewBounds.right + inset;
    if (Math.abs(delta) > 1) viewport.scrollBy({ left: delta, behavior });
  };

  window.setTimeout(() => correctPosition("smooth"), 90);
  window.setTimeout(() => correctPosition("auto"), 620);
}

function openBook(index, pin = false) {
  if (activeIndex === index && bookElements[index].classList.contains("is-open")) return;
  if (activeIndex !== null && activeIndex !== index) closeBook(activeIndex, true);

  const element = bookElements[index];
  const side = getOpenSide(index);
  activeIndex = index;
  if (pin) pinnedIndex = index;
  element.dataset.openSide = side;
  element.classList.add("is-open");
  element.setAttribute("aria-expanded", "true");
  applyBookShifts(index);
  activeTitle.textContent = `${books[index].title} / ${books[index].author}`;
  activeNumber.textContent = String(index + 1).padStart(2, "0");
  keepCoverInView(index);
}

function resetBookShifts() {
  bookElements.forEach((element) => element.style.setProperty("--shift", "0px"));
}

function closeBook(index, force = false) {
  if (!force && pinnedIndex === index) return;
  const element = bookElements[index];
  element.classList.remove("is-open");
  element.setAttribute("aria-expanded", "false");
  if (activeIndex === index) activeIndex = null;
  resetBookShifts();
}

function getDetailBookRect() {
  const compact = window.innerWidth <= 720;
  const shortCompact = compact && window.innerHeight <= 640;
  const book = books[detailIndex ?? activeIndex ?? 0];
  const coverRatio = book.coverRatio || 2 / 3;
  const idealWidth = compact
    ? Math.min(174, window.innerWidth * 0.44)
    : Math.min(330, Math.max(290, window.innerWidth * 0.25));
  const maxHeight = compact
    ? window.innerHeight * (shortCompact ? 0.34 : 0.42)
    : window.innerHeight * 0.7;
  const height = Math.min(idealWidth / coverRatio, maxHeight);
  const width = height * coverRatio;
  const left = compact
    ? (window.innerWidth - width) / 2
    : window.innerWidth * 0.25 - width / 2;
  const top = compact
    ? Math.max(shortCompact ? 56 : 72, window.innerHeight * (shortCompact ? 0.08 : 0.11))
    : window.innerHeight * 0.53 - height / 2;
  return { left, top, width, height };
}

function getShellTransform(rect, shellRect) {
  const scaleX = rect.width / shellRect.width;
  const scaleY = rect.height / shellRect.height;
  return `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${scaleX}, ${scaleY})`;
}

function populateBookDetail(index) {
  const book = books[index];
  detail.style.setProperty("--detail-bg", book.detailColor ?? book.color);
  detail.style.setProperty("--detail-ink", readableDetailInk(book));
  detail.style.setProperty("--cover", book.color);
  detail.style.setProperty("--cover-ink", book.ink);
  detail.style.setProperty("--spine", book.spine);
  detail.style.setProperty("--spine-ink", book.spineInk);
  detail.style.setProperty("--art-opacity", String(book.opacity ?? 1));
  detail.style.setProperty("--art-filter", book.filter ?? "none");
  detailFront.innerHTML = coverMarkup(book, index);
  detailNumber.textContent = `${String(index + 1).padStart(2, "0")} / ${String(books.length).padStart(2, "0")}`;
  detailTitle.textContent = book.title;
  detailAuthor.textContent = book.author;
  detailDescription.innerHTML = book.description
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function positionDetailBook() {
  const target = getDetailBookRect();
  detailBookShell.style.width = `${target.width}px`;
  detailBookShell.style.height = `${target.height}px`;
  detailBookShell.style.transform = `translate3d(${target.left}px, ${target.top}px, 0) scale(1)`;
}

function openBookDetail(index) {
  if (detailIndex !== null || activeIndex !== index) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const source = bookElements[index].querySelector(".book-object");
  const sourceRect = source.getBoundingClientRect();
  const target = getDetailBookRect();
  detailOriginRect = {
    left: sourceRect.left,
    top: sourceRect.top,
    width: sourceRect.width,
    height: sourceRect.height,
  };
  window.clearTimeout(detailCopyTimer);
  window.clearTimeout(detailSettleTimer);
  window.clearTimeout(detailCloseTimer);
  detailIndex = index;
  populateBookDetail(index);
  detailCopy.classList.remove("is-visible");
  detail.classList.remove("is-returning");
  detail.classList.remove("is-settled");
  detail.hidden = false;
  detail.setAttribute("aria-hidden", "false");
  masthead.setAttribute("aria-hidden", "true");
  shelfRegion.setAttribute("aria-hidden", "true");
  shelfRegion.setAttribute("inert", "");
  shelfRegion.inert = true;
  detailBookShell.style.width = `${target.width}px`;
  detailBookShell.style.height = `${target.height}px`;
  detailBookShell.style.transform = getShellTransform(detailOriginRect, target);
  detailBookShell.getBoundingClientRect();

  requestAnimationFrame(() => {
    library.classList.add("is-detail-open");
    detail.classList.add("is-visible");
    bookElements[index].classList.add("is-detail-source");
    positionDetailBook();
    detailCopyTimer = window.setTimeout(() => {
      detailCopy.classList.add("is-visible");
    }, prefersReducedMotion ? 20 : 560);
    detailSettleTimer = window.setTimeout(() => {
      detail.classList.add("is-settled");
      detailCopy.focus({ preventScroll: true });
    }, prefersReducedMotion ? 40 : 980);
  });
}

function closeBookDetail() {
  if (detailIndex === null || detail.classList.contains("is-returning")) return;
  const returnIndex = detailIndex;
  const target = getDetailBookRect();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.clearTimeout(detailCopyTimer);
  window.clearTimeout(detailSettleTimer);
  window.clearTimeout(detailCloseTimer);
  detail.classList.add("is-returning");
  detail.classList.remove("is-settled");
  detailCopy.classList.remove("is-visible");
  library.classList.remove("is-detail-open");
  if (detailOriginRect) detailBookShell.style.transform = getShellTransform(detailOriginRect, target);

  detailCloseTimer = window.setTimeout(() => {
    bookElements[returnIndex].classList.remove("is-detail-source");
    detail.hidden = true;
    detail.setAttribute("aria-hidden", "true");
    detail.classList.remove("is-visible");
    detail.classList.remove("is-returning");
    detailIndex = null;
    pinnedIndex = null;
    masthead.removeAttribute("aria-hidden");
    shelfRegion.removeAttribute("aria-hidden");
    shelfRegion.removeAttribute("inert");
    shelfRegion.inert = false;
    bookElements[returnIndex].focus({ preventScroll: true });
    keepCoverInView(returnIndex);
  }, prefersReducedMotion ? 20 : 1040);
}

function navigateTo(index) {
  const normalized = (index + books.length) % books.length;
  pinnedIndex = normalized;
  openBook(normalized, true);
  const element = bookElements[normalized];
  const viewBounds = viewport.getBoundingClientRect();
  const bounds = element.getBoundingClientRect();
  viewport.scrollBy({
    left: bounds.left - viewBounds.left - viewBounds.width / 2 + bounds.width / 2,
    behavior: "smooth",
  });
  element.focus({ preventScroll: true });
}

books.forEach(createBook);
totalBooks.textContent = String(books.length).padStart(2, "0");
activeTitle.textContent = books[0].title;
window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
measureShelf();

viewport.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) < 0.1 && Math.abs(event.deltaX) < 0.1) return;
  event.preventDefault();
  viewport.scrollLeft += event.deltaY + event.deltaX;
}, { passive: false });

viewport.addEventListener("scroll", () => {
  if (viewport.scrollTop !== 0) viewport.scrollTop = 0;
});

viewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  dragStartX = event.clientX;
  dragStartScroll = viewport.scrollLeft;
  isDragging = true;
  hasDragged = false;
  pressedBookElement = event.target instanceof Element ? event.target.closest(".book-slot") : null;
});

viewport.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const distance = event.clientX - dragStartX;
  if (Math.abs(distance) > 5 && !hasDragged) {
    hasDragged = true;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  }
  if (!hasDragged) return;
  viewport.scrollLeft = dragStartScroll - distance;
});

function endDrag(event, allowTap = false) {
  if (!isDragging) return;
  const tappedBook = allowTap && !hasDragged ? pressedBookElement : null;
  const pointerWasDragged = hasDragged;
  isDragging = false;
  pressedBookElement = null;
  viewport.classList.remove("is-dragging");
  if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  window.setTimeout(() => {
    if (!pointerWasDragged && tappedBook && detailIndex === null && detailOpenTimer === 0) {
      tappedBook.click();
    }
    hasDragged = false;
  }, 0);
}

viewport.addEventListener("pointerup", (event) => endDrag(event, true));
viewport.addEventListener("pointercancel", (event) => endDrag(event, false));

viewport.addEventListener("keydown", (event) => {
  const current = activeIndex ?? 0;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    navigateTo(current + 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigateTo(current - 1);
  } else if (event.key === "Escape") {
    pinnedIndex = null;
    if (activeIndex !== null) closeBook(activeIndex, true);
    viewport.focus();
  }
});

previousBook.addEventListener("click", () => navigateTo((activeIndex ?? 0) - 1));
nextBook.addEventListener("click", () => navigateTo((activeIndex ?? -1) + 1));

detailClose.addEventListener("click", closeBookDetail);
detailReturn.addEventListener("click", closeBookDetail);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && detailIndex !== null) {
    event.preventDefault();
    closeBookDetail();
  }
});

window.addEventListener("resize", () => {
  measureShelf();
  if (detailIndex !== null && !detail.classList.contains("is-returning")) positionDetailBook();
});
}).catch((error) => {
  console.error(error);
  const status = document.querySelector("#activeTitle");
  if (status) status.textContent = "书单加载失败，请检查 books.tsv";
});
