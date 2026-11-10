const STORAGE_KEY = "vact-vietnam-study-v1";
const viewLabels = { overview: "TỔNG QUAN", lessons: "TÀI LIỆU", review: "ÔN TẬP", ask: "HỎI ĐÁP" };
const stopWords = new Set("va la cua cho trong nhung cac mot nhung gi nao the nao duoc co ve den tu tai khi voi theo duoi tren sau truoc giua ve hay la gi khong nao".split(" "));
let documents = [];
let activeDocument = null;
let currentReviewId = null;
let answerVisible = false;
let lastQuestion = "";
let searchResults = [];

function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
let state = readState();
state.completed ||= [];
state.cards ||= [];

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function foldText(value) {
  return value.toLocaleLowerCase("vi").replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function foldWithMap(value) {
  let folded = "";
  const map = [];
  [...value].forEach((char, originalIndex) => {
    const normalized = char.toLocaleLowerCase("vi").replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const unit of normalized) { folded += unit; map.push(originalIndex); }
  });
  return { folded, map };
}
function dueCards() { return state.cards.filter(card => !card.due || card.due <= Date.now()).sort((a, b) => (a.due || 0) - (b.due || 0)); }
function updateProgress() {
  const done = new Set(state.completed);
  const count = done.size;
  const percent = Math.round(count / 8 * 100);
  document.querySelector("#progress-count").textContent = `${count} / 8`;
  document.querySelector("#progress-percent").textContent = `${percent}% hoàn thành`;
  document.querySelector("#progress-fill").style.width = `${percent}%`;
  document.querySelector("#due-nav").textContent = dueCards().length;
  document.querySelector("#overview-due").textContent = dueCards().length ? `${dueCards().length} thẻ đang chờ ôn` : "Tạo thẻ từ nội dung đã tra cứu";
}

function lessonRow(doc) {
  const done = state.completed.includes(doc.id);
  return `<div class="lesson-row">
    <span class="lesson-number">${String(doc.id).padStart(2, "0")}</span>
    <span><strong class="lesson-title">${escapeHtml(doc.title)}</strong><small class="lesson-summary">${escapeHtml(doc.summary)}</small></span>
    <span class="lesson-state ${done ? "done" : ""}">${done ? "Đã học" : "Chưa học"}</span>
    <button class="lesson-open" data-open-doc="${doc.id}" aria-label="Mở ${escapeHtml(doc.title)}">→</button>
  </div>`;
}
function renderLessons() {
  document.querySelector("#overview-lessons").innerHTML = documents.slice(0, 4).map(lessonRow).join("");
  document.querySelector("#all-lessons").innerHTML = documents.map(lessonRow).join("");
  updateProgress();
}
function setView(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
  document.querySelector("#crumb-current").textContent = viewLabels[name] || viewLabels.overview;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "review") renderReview();
}
function openDocument(id, page = 1) {
  const doc = documents.find(item => item.id === Number(id));
  if (!doc) return;
  activeDocument = doc;
  const url = `${doc.file}#page=${page}`;
  document.querySelector("#reader-title").textContent = doc.title;
  document.querySelector("#reader-index").textContent = `PHẦN ${String(doc.id).padStart(2, "0")}`;
  document.querySelector("#pdf-reader").src = url;
  document.querySelector("#reader-new-tab").href = url;
  document.querySelector("#reader-wrap").hidden = false;
  document.querySelector("#mark-complete").textContent = state.completed.includes(doc.id) ? "ĐÃ HOÀN THÀNH ✓" : "ĐÁNH DẤU ĐÃ HỌC";
  setView("lessons");
  setTimeout(() => document.querySelector("#reader-wrap").scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}
function markComplete() {
  if (!activeDocument) return;
  if (!state.completed.includes(activeDocument.id)) state.completed.push(activeDocument.id);
  saveState();
  renderLessons();
  document.querySelector("#mark-complete").textContent = "ĐÃ HOÀN THÀNH ✓";
}

function renderReview() {
  const main = document.querySelector("#review-main");
  const due = dueCards();
  let card = due.find(item => item.id === currentReviewId) || due[0];
  if (!card) {
    const next = state.cards.filter(item => item.due > Date.now()).sort((a, b) => a.due - b.due)[0];
    const wait = next ? `Thẻ tiếp theo sẽ sẵn sàng ${new Date(next.due).toLocaleString("vi-VN", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.` : "Tra cứu một câu hỏi và lưu đoạn trích, hoặc tự tạo thẻ bên dưới.";
    main.innerHTML = `<div class="review-empty"><span class="section-index">${state.cards.length ? "ĐÃ ÔN XONG" : "BỘ THẺ CỦA BẠN"}</span><h2>${state.cards.length ? "Bạn đã hoàn thành lượt ôn." : "Bắt đầu với một thẻ đầu tiên."}</h2><p>${escapeHtml(wait)}${state.cards.length ? ` Hiện có ${state.cards.length} thẻ trong bộ ôn.` : ""}</p></div>${manualCardForm()}`;
    currentReviewId = null;
    return;
  }
  currentReviewId = card.id;
  main.innerHTML = `<div class="review-card" id="flip-card" role="button" tabindex="0" aria-label="Lật thẻ để xem đáp án">
      <div class="review-card-top"><span>THẺ ${state.cards.indexOf(card) + 1} / ${state.cards.length}</span><span>${answerVisible ? "MẶT ĐÁP ÁN" : "MẶT CÂU HỎI"}</span></div>
      <div>${answerVisible ? `<p class="answer-text">${escapeHtml(card.back)}</p><span class="result-note">${card.source ? `Nguồn: ${escapeHtml(card.source)}` : "Thẻ tự tạo"}</span>` : `<h2>${escapeHtml(card.front)}</h2><span class="review-flip-hint">Chạm để lật thẻ và đối chiếu →</span>`}</div>
      <div class="review-card-top"><span>ÔN TẬP CÁCH QUÃNG</span><span>${answerVisible ? "CHỌN MỨC ĐỘ GHI NHỚ" : ""}</span></div>
    </div>
    <div class="review-controls"><button data-grade="again" ${answerVisible ? "" : "disabled"}>Chưa nhớ</button><button data-grade="good" ${answerVisible ? "" : "disabled"}>Đã nhớ</button><button data-grade="easy" ${answerVisible ? "" : "disabled"}>Nhớ dễ dàng</button></div>
    ${manualCardForm()}`;
}
function manualCardForm() {
  return `<details class="add-card"><summary>+ Tự tạo thẻ ôn tập</summary><form class="add-card-form" id="add-card-form"><input name="front" placeholder="Câu hỏi / mặt trước" required maxlength="220" /><textarea name="back" placeholder="Câu trả lời / mặt sau" required maxlength="1500"></textarea><button class="button button-secondary button-small">LƯU THẺ</button></form></details>`;
}
function flipCard() { answerVisible = !answerVisible; renderReview(); }
function gradeCard(level) {
  const card = state.cards.find(item => item.id === currentReviewId);
  if (!card) return;
  const delay = { again: 10 * 60 * 1000, good: 24 * 60 * 60 * 1000, easy: 3 * 24 * 60 * 60 * 1000 }[level];
  card.due = Date.now() + delay;
  card.interval = level === "again" ? 0 : level === "good" ? 1 : 3;
  saveState();
  currentReviewId = null;
  answerVisible = false;
  updateProgress();
  renderReview();
}
function addCard(front, back, source = "") {
  if (!front.trim() || !back.trim()) return;
  state.cards.push({ id: crypto.randomUUID(), front: front.trim(), back: back.trim(), source, due: Date.now(), interval: 0 });
  saveState();
  updateProgress();
}

function getSnippet(text, query) {
  const { folded, map } = foldWithMap(text);
  const terms = foldText(query).match(/[a-z0-9]+/g) || [];
  let at = -1;
  for (const term of terms) {
    if (stopWords.has(term) || term.length < 2) continue;
    const position = folded.indexOf(term);
    if (position >= 0 && (at < 0 || position < at)) at = position;
  }
  const startAt = at >= 0 ? map[at] : 0;
  const start = Math.max(0, startAt - 115);
  const end = Math.min(text.length, startAt + 290);
  return `${start ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}
function searchCorpus(question) {
  const query = foldText(question);
  const terms = [...new Set(query.match(/[a-z0-9]+/g) || [])].filter(term => term.length > 1 && !stopWords.has(term));
  if (!terms.length) return [];
  const matches = [];
  for (const doc of documents) {
    doc.pages.forEach((text, index) => {
      const folded = foldText(text);
      const hits = terms.filter(term => folded.includes(term));
      if (!hits.length) return;
      const score = hits.length / terms.length + (folded.includes(query) ? 1.5 : 0);
      matches.push({ doc, page: index + 1, text, hits, score });
    });
  }
  return matches.sort((a, b) => b.score - a.score || b.hits.length - a.hits.length).slice(0, 5);
}
function renderSearchResults(question, results) {
  const target = document.querySelector("#search-results");
  if (!results.length) {
    target.innerHTML = `<p class="empty-search">Không tìm thấy đoạn phù hợp trong văn bản đã trích. Thử từ khóa khác hoặc mở tài liệu PDF để tra cứu thêm.</p>`;
    return;
  }
  target.innerHTML = results.map((result, index) => {
    const excerpt = getSnippet(result.text, question);
    return `<article class="result-item">
      <div class="result-meta"><strong>PHẦN ${String(result.doc.id).padStart(2, "0")} · ${escapeHtml(result.doc.title)}</strong><span>TRANG ${result.page}</span></div>
      <blockquote>${escapeHtml(excerpt)}</blockquote>
      <div class="result-actions"><button class="text-link" data-result-open="${result.doc.id}" data-result-page="${result.page}">MỞ TRANG GỐC <span>↗</span></button><button class="text-link" data-save-result="${index}">LƯU THÀNH THẺ ÔN <span>+</span></button></div>
    </article>`;
  }).join("");
}

document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) { event.preventDefault(); setView(viewButton.dataset.view); }
  const openButton = event.target.closest("[data-open-doc]");
  if (openButton) openDocument(openButton.dataset.openDoc);
  const resultOpen = event.target.closest("[data-result-open]");
  if (resultOpen) openDocument(resultOpen.dataset.resultOpen, resultOpen.dataset.resultPage);
  if (event.target.closest("#mark-complete")) markComplete();
  if (event.target.closest("#continue-button")) openDocument(documents.find(doc => !state.completed.includes(doc.id))?.id || 1);
  if (event.target.closest("#flip-card")) flipCard();
  const gradeButton = event.target.closest("[data-grade]");
  if (gradeButton) gradeCard(gradeButton.dataset.grade);
  const saveButton = event.target.closest("[data-save-result]");
  if (saveButton) {
    const result = searchResults[Number(saveButton.dataset.saveResult)];
    if (!result) return;
    addCard(lastQuestion, getSnippet(result.text, lastQuestion), `${result.doc.title} · trang ${result.page}`);
    saveButton.textContent = "ĐÃ LƯU ✓";
    saveButton.disabled = true;
    updateProgress();
  }
});
document.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.id === "flip-card") { event.preventDefault(); flipCard(); }
});
document.addEventListener("submit", event => {
  if (event.target.id === "search-form") {
    event.preventDefault();
    lastQuestion = document.querySelector("#question-input").value.trim();
    if (!lastQuestion) return;
    searchResults = searchCorpus(lastQuestion);
    renderSearchResults(lastQuestion, searchResults);
  }
  if (event.target.id === "add-card-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    addCard(form.get("front"), form.get("back"));
    answerVisible = false;
    renderReview();
  }
});

fetch("content.json")
  .then(response => { if (!response.ok) throw new Error("Không tải được học liệu"); return response.json(); })
  .then(data => { documents = data; renderLessons(); })
  .catch(() => {
    document.querySelector("#overview-lessons").innerHTML = `<p class="empty-search">Không tải được dữ liệu. Hãy mở trang qua máy chủ web tĩnh, không mở trực tiếp bằng file.</p>`;
    document.querySelector("#all-lessons").innerHTML = `<p class="empty-search">Không tải được dữ liệu học liệu.</p>`;
  });
updateProgress();
