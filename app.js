/* ============================================================
   V-ACT Tiếng Việt — Ứng dụng
   Không cần build. Chạy trực tiếp trên GitHub Pages.
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.VACT || { topics: [], lessons: [], topicMap: {}, lessonMap: {} };

  var STORE = {
    done: "vact:done",
    quiz: "vact:quiz",
    known: "vact:known",
    last: "vact:last"
  };

  /* ----------------------------- Storage ----------------------------- */

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* Bỏ qua khi trình duyệt chặn localStorage */
    }
  }

  var state = {
    done: read(STORE.done, []),
    quiz: read(STORE.quiz, {}),
    known: read(STORE.known, {})
  };

  if (!Array.isArray(state.done)) state.done = [];
  if (!state.quiz || typeof state.quiz !== "object") state.quiz = {};
  if (!state.known || typeof state.known !== "object") state.known = {};

  function isDone(id) {
    return state.done.indexOf(id) !== -1;
  }

  function completedCount() {
    return DATA.lessons.filter(function (l) {
      return isDone(l.id);
    }).length;
  }

  function progressPercent() {
    if (!DATA.lessons.length) return 0;
    return Math.round((completedCount() / DATA.lessons.length) * 100);
  }

  function topicProgress(topic) {
    if (!topic.lessons.length) return { done: 0, total: 0, pct: 0 };
    var done = topic.lessons.filter(function (l) {
      return isDone(l.id);
    }).length;
    return {
      done: done,
      total: topic.lessons.length,
      pct: Math.round((done / topic.lessons.length) * 100)
    };
  }

  function nextLesson() {
    var next = DATA.lessons.filter(function (l) {
      return !isDone(l.id);
    })[0];
    return next || DATA.lessons[DATA.lessons.length - 1];
  }

  function bestScore(lessonId) {
    return state.quiz[lessonId] || null;
  }

  function topicOf(lesson) {
    return DATA.topicMap[lesson.topic] || { roman: "", title: "" };
  }

  /* ----------------------------- Helpers ----------------------------- */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  var toastTimer = null;
  function toast(message) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2600);
  }

  function arrowIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function checkIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function clockIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.4"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  }

  function quizIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h14v16H5z" stroke="currentColor" stroke-width="1.4"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  }

  function cardsIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="6.5" width="12" height="14" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M7 3.5h12.5a1 1 0 0 1 1 1V18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  }

  function sparkIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.3"/></svg>';
  }

  function bookIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" stroke="currentColor" stroke-width="1.4"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" stroke="currentColor" stroke-width="1.4"/></svg>';
  }

  function ring(percent, size, radius, cls) {
    var c = 2 * Math.PI * radius;
    var offset = c - (Math.max(0, Math.min(100, percent)) / 100) * c;
    var view = size;
    var center = size / 2;
    return (
      '<svg viewBox="0 0 ' + view + " " + view + '" aria-hidden="true">' +
      '<circle class="ring-bg" cx="' + center + '" cy="' + center + '" r="' + radius + '" />' +
      '<circle class="ring-fg" cx="' + center + '" cy="' + center + '" r="' + radius +
      '" style="stroke-dasharray:' + c.toFixed(2) + ";stroke-dashoffset:" + offset.toFixed(2) + '" />' +
      "</svg>"
    );
  }

  /* ----------------------------- Router ----------------------------- */

  var routes = {};

  function parseRoute() {
    var raw = (location.hash || "").replace(/^#\/?/, "");
    var parts = raw.split("/").filter(Boolean);
    if (!parts.length) return { name: "home", params: [] };
    return { name: parts[0], params: parts.slice(1) };
  }

  var currentRouteKey = "";

  function render(keepScroll) {
    var route = parseRoute();
    var key = route.name + "/" + route.params.join("/");

    var handler = routes[route.name] || routes.notfound;
    var html = handler(route.params);

    $("#app").innerHTML = '<div class="view">' + html + "</div>";

    currentRouteKey = key;

    updateHeader(route);
    updateRing();
    updateDocumentTitle(route);

    if (!keepScroll) {
      window.scrollTo(0, 0);
    }
  }

  function updateDocumentTitle(route) {
    var title = "V-ACT Tiếng Việt — Học sâu từng tầng nghĩa";
    if (route.name === "bai" && DATA.lessonMap[route.params[0]]) {
      title = DATA.lessonMap[route.params[0]].title + " — V-ACT Tiếng Việt";
    } else if (route.name === "chuong" && DATA.topicMap[route.params[0]]) {
      title = DATA.topicMap[route.params[0]].title + " — V-ACT Tiếng Việt";
    } else if (route.name === "quiz") {
      title = "Kiểm tra — V-ACT Tiếng Việt";
    } else if (route.name === "on-tap") {
      title = "Ôn lại kiến thức — V-ACT Tiếng Việt";
    } else if (route.name === "tien-do") {
      title = "Tiến độ học tập — V-ACT Tiếng Việt";
    } else if (route.name === "ai") {
      title = "AI luyện tập — V-ACT Tiếng Việt";
    } else if (route.name === "lo-trinh") {
      title = "Lộ trình học — V-ACT Tiếng Việt";
    }
    document.title = title;
  }

  function updateHeader(route) {
    var active =
      route.name === "lo-trinh" ? "lo-trinh" :
      route.name === "on-tap" ? "on-tap" :
      route.name === "quiz" || route.name === "kiem-tra" ? "kiem-tra" :
      route.name === "tien-do" ? "tien-do" :
      route.name === "ai" ? "ai" :
      "";

    $all("[data-nav]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === active);
    });

    var nav = $("#mobileNav");
    if (nav) {
      nav.classList.remove("open");
      nav.hidden = true;
    }
    var trigger = $("#menuTrigger");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", "Mở menu");
    }
  }

  function updateRing() {
    var pct = progressPercent();
    var fg = $("#headerRing");
    if (fg) {
      var c = 2 * Math.PI * 15;
      fg.style.strokeDasharray = c.toFixed(2);
      fg.style.strokeDashoffset = (c - (pct / 100) * c).toFixed(2);
    }
    var label = $("#headerProgressLabel");
    if (label) label.textContent = pct + "%";
  }

  /* ----------------------------- Components ----------------------------- */

  function breadcrumb(items) {
    return (
      '<nav class="breadcrumb" aria-label="Đường dẫn">' +
      items
        .map(function (it, i) {
          var node = it.href
            ? '<a href="' + it.href + '">' + esc(it.label) + "</a>"
            : "<span>" + esc(it.label) + "</span>";
          return (i ? '<span class="sep">/</span>' : "") + node;
        })
        .join("") +
      "</nav>"
    );
  }

  function pageHero(opts) {
    return (
      '<section class="page-hero"><div class="shell">' +
      (opts.crumbs ? breadcrumb(opts.crumbs) : "") +
      '<div class="page-hero-row">' +
      "<div>" +
      (opts.eyebrow ? '<p class="eyebrow">' + esc(opts.eyebrow) + "</p>" : "") +
      "<h1>" + opts.title + "</h1>" +
      (opts.lede ? '<p class="page-lede">' + esc(opts.lede) + "</p>" : "") +
      "</div>" +
      (opts.side ? '<div class="section-head-side">' + opts.side + "</div>" : "") +
      "</div></div></section>"
    );
  }

  function lessonRow(lesson) {
    var done = isDone(lesson.id);
    return (
      '<a class="lesson-row' + (done ? " done" : "") + '" href="#/bai/' + lesson.id + '">' +
      '<span class="lr-num">' + pad(lesson.order) + "</span>" +
      '<div class="lr-main">' +
      "<h3>" + esc(lesson.title) + "</h3>" +
      "<p>" + esc(lesson.subtitle) + "</p>" +
      (done ? '<span class="chip chip-success" style="margin-top:8px">Đã học</span>' : "") +
      "</div>" +
      '<div class="lr-meta">' + clockIcon() + "<span>" + lesson.minutes + " phút</span>" +
      '<span style="color:var(--line-strong)">·</span><span>' + lesson.quiz.length + " câu</span></div>" +
      '<span class="lr-open" aria-hidden="true">' + arrowIcon() + "</span>" +
      "</a>"
    );
  }

  function topicCard(topic) {
    var p = topicProgress(topic);
    return (
      '<a class="topic-card" href="#/chuong/' + topic.id + '">' +
      '<div class="tc-top"><span class="topic-roman">Chuyên đề ' + esc(topic.roman) + "</span>" +
      '<span class="tc-count">' + p.done + "/" + p.total + "</span></div>" +
      "<h3>" + esc(topic.title) + "</h3>" +
      "<p>" + esc(topic.description) + "</p>" +
      '<div class="tc-foot"><span class="tc-bar"><i style="width:' + p.pct + '%"></i></span>' +
      '<span class="tc-pct">' + p.pct + "%</span></div>" +
      '<span class="tc-arrow">' + arrowIcon() + "</span>" +
      "</a>"
    );
  }

  function renderTable(table) {
    var head = table.head || [];
    var rows = table.rows || [];
    return (
      '<div class="table-wrap"><table><thead><tr>' +
      head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      rows.map(function (row) {
        return "<tr>" + row.map(function (cell) { return "<td>" + esc(cell) + "</td>"; }).join("") + "</tr>";
      }).join("") +
      "</tbody></table></div>"
    );
  }

  function renderExample(ex) {
    return (
      '<div class="example">' +
      (ex.title ? "<h4>" + esc(ex.title) + "</h4>" : "") +
      (ex.quote ? '<p class="ex-quote">' + esc(ex.quote) + "</p>" : "") +
      (ex.body || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      (ex.analysis ? '<p class="ex-analysis"><strong>Phân tích.</strong> ' + esc(ex.analysis) + "</p>" : "") +
      "</div>"
    );
  }

  function renderSection(sec, idx) {
    var out = '<section class="lesson-section" id="sec-' + idx + '">';
    if (sec.h) out += "<h2>" + esc(sec.h) + "</h2>";
    (sec.p || []).forEach(function (p) { out += "<p>" + esc(p) + "</p>"; });
    if (sec.example) out += renderExample(sec.example);
    if (sec.list) {
      out += '<ul class="tight-list">' + sec.list.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>";
    }
    if (sec.compare) {
      out += '<div class="compare">' + sec.compare.map(function (col) {
        return (
          '<div class="compare-col">' +
          "<h4>" + (col.badge ? '<span class="badge">' + esc(col.badge) + "</span>" : "") + esc(col.title) + "</h4>" +
          (col.text ? "<p>" + esc(col.text) + "</p>" : "") +
          (col.list ? "<ul>" + col.list.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>"
        );
      }).join("") + "</div>";
    }
    if (sec.table) out += renderTable(sec.table);
    if (sec.steps) {
      out += '<ol class="steps">' + sec.steps.map(function (st) {
        return "<li><strong>" + esc(st.title) + "</strong>" + esc(st.text) + "</li>";
      }).join("") + "</ol>";
    }
    if (sec.note) {
      out += '<div class="note"><span class="note-label">' + esc(sec.note.label) + "</span>" + esc(sec.note.text) + "</div>";
    }
    return out + "</section>";
  }

  /* ----------------------------- Views ----------------------------- */

  routes.home = function () {
    var pct = progressPercent();
    var next = nextLesson();
    var doneCount = completedCount();

    var roadmap = DATA.topics.map(function (t, i) {
      var tp = topicProgress(t);
      var cls = tp.pct === 100 ? "done" : tp.done > 0 ? "current" : "";
      return (
        '<li class="' + cls + '"><span class="dot">' + (tp.pct === 100 ? "✓" : esc(t.roman)) + "</span>" +
        '<span class="rm-title">' + esc(t.title) + '</span><span class="rm-count">' + tp.done + "/" + tp.total + "</span></li>"
      );
    }).join("");

    return (
      '<section class="hero"><div class="shell hero-inner">' +
      "<div>" +
      '<p class="eyebrow">Đánh giá năng lực · Tiếng Việt</p>' +
      "<h1>Học sâu<em>từng tầng nghĩa.</em></h1>" +
      '<p class="hero-lede">Toàn bộ lý thuyết Tiếng Việt của bộ tài liệu V-ACT được chọn lọc, chia thành 18 bài học có ví dụ, thẻ ghi nhớ và bài kiểm tra — để bạn hiểu bản chất thay vì học vẹt.</p>' +
      '<div class="hero-actions">' +
      '<a class="btn btn-primary" href="#/bai/' + next.id + '">Bắt đầu học' + arrowIcon() + "</a>" +
      '<a class="btn btn-secondary" href="#/lo-trinh">Xem lộ trình</a>' +
      "</div>" +
      '<div class="hero-stats">' +
      '<div class="hero-stat"><strong>' + DATA.lessons.length + "</strong><span>Bài học</span></div>" +
      '<div class="hero-stat"><strong>' + DATA.topics.length + "</strong><span>Chuyên đề</span></div>" +
      '<div class="hero-stat"><strong>' + DATA.totalQuiz + "</strong><span>Câu hỏi</span></div>" +
      '<div class="hero-stat"><strong>' + DATA.totalCards + "</strong><span>Thẻ ghi nhớ</span></div>" +
      "</div></div>" +

      '<aside class="hero-panel">' +
      '<div class="panel-top"><span class="mono">TIẾN ĐỘ CỦA BẠN</span><span class="chip chip-gold">' +
      (doneCount ? "Đang học" : "Bắt đầu") + "</span></div>" +
      '<div class="panel-progress"><strong>' + pct + '%</strong><span>' + doneCount + "/" + DATA.lessons.length + " bài đã hoàn thành</span></div>" +
      '<ul class="roadmap">' + roadmap + "</ul>" +
      '<a class="btn btn-primary btn-block" href="#/bai/' + next.id + '">' +
      (doneCount ? "Học tiếp: " + esc(next.title) : "Bắt đầu bài đầu tiên") + "</a>" +
      "</aside>" +
      "</div></section>" +

      '<div class="quote-strip"><div class="shell quote-strip-inner">' +
      '<span class="q-mark" aria-hidden="true">“</span>' +
      "<blockquote>Ngôn ngữ là tấm gương phản chiếu tư duy. Hiểu tiếng Việt là hiểu cách ta nghĩ.<cite>V-ACT Tiếng Việt</cite></blockquote>" +
      "</div></div>" +

      '<section class="section"><div class="shell">' +
      '<div class="section-head"><div><p class="eyebrow">Chương trình</p><h2>Sáu chuyên đề, một mạch kiến thức</h2></div>' +
      "<p>Từ cấu tạo từ đến đọc hiểu văn bản — mỗi chuyên đề là một tầng của năng lực ngôn ngữ, được sắp xếp để bạn học tuần tự hoặc chọn phần còn yếu.</p></div>" +
      '<div class="topic-grid">' + DATA.topics.map(topicCard).join("") + "</div>" +
      "</div></section>" +

      '<section class="section tight"><div class="shell">' +
      '<div class="section-head"><div><p class="eyebrow">Cách học</p><h2>Bốn công cụ, một vòng lặp</h2></div>' +
      "<p>Đọc lý thuyết → xem ví dụ → nhớ bằng thẻ → kiểm tra lại. Vòng lặp này giúp kiến thức ở lại lâu hơn.</p></div>" +
      '<div class="feature-grid">' +
      '<div class="feature-card"><div class="feature-icon">' + bookIcon() + "</div><h3>Bài học có ví dụ</h3>" +
      "<p>Mỗi khái niệm đều đi kèm ví dụ và phần phân tích, để bạn thấy cách áp dụng trong đề thi thật.</p>" +
      '<a class="fc-link" href="#/lo-trinh">Vào lộ trình <span>→</span></a></div>' +
      '<div class="feature-card"><div class="feature-icon">' + cardsIcon() + "</div><h3>Ôn lại kiến thức</h3>" +
      "<p>Thẻ ghi nhớ và điểm chốt giúp ôn nhanh, đánh dấu thẻ đã nhớ và quay lại đúng chỗ còn yếu.</p>" +
      '<a class="fc-link" href="#/on-tap">Ôn tập ngay <span>→</span></a></div>' +
      '<div class="feature-card"><div class="feature-icon">' + quizIcon() + "</div><h3>Kiểm tra có giải thích</h3>" +
      "<p>Câu hỏi trắc nghiệm kèm đáp án và lời giải, lưu điểm cao nhất để bạn theo dõi tiến bộ.</p>" +
      '<a class="fc-link" href="#/kiem-tra">Làm bài kiểm tra <span>→</span></a></div>' +
      "</div></div></section>" +

      '<section class="section tight"><div class="shell">' +
      '<div class="practice-cta">' +
      "<div><h3>AI luyện tập — sắp ra mắt</h3><p>Tạo bài tập riêng theo chuyên đề, mức độ và dạng câu bạn muốn luyện. Hiện tại bạn có thể dùng kho bài kiểm tra có sẵn.</p></div>" +
      '<div class="cta-actions"><a class="btn btn-secondary" href="#/ai">Xem kế hoạch</a><a class="btn btn-primary" href="#/kiem-tra">Luyện tập ngay</a></div>' +
      "</div></div></section>"
    );
  };

  routes.roadmap = function () {
    var sections = DATA.topics.map(function (t) {
      var p = topicProgress(t);
      return (
        '<section class="section tight" id="' + t.id + '"><div class="shell">' +
        '<div class="section-head"><div><p class="eyebrow">Chuyên đề ' + esc(t.roman) + "</p><h2>" + esc(t.title) + "</h2></div>" +
        "<p>" + esc(t.description) + " <span class=\"mono\" style=\"display:block;margin-top:8px\">" + p.done + "/" + p.total + " bài · " + p.pct + "%</span></p></div>" +
        '<div class="lesson-list">' + t.lessons.map(lessonRow).join("") + "</div>" +
        "</div></section>"
      );
    }).join("");

    return (
      pageHero({
        crumbs: [{ label: "Trang chủ", href: "#/" }, { label: "Lộ trình" }],
        eyebrow: "Lộ trình học",
        title: "18 bài, đi từ nền tảng đến <span class=\"ital gold\">đọc hiểu</span>",
        lede: "Học tuần tự theo chuyên đề hoặc nhảy đến phần bạn cần. Mỗi bài có thời lượng ước tính, ví dụ minh họa và bài kiểm tra riêng.",
        side: '<a class="btn btn-secondary btn-sm" href="#/tien-do">Xem tiến độ</a>'
      }) + sections
    );
  };

  routes.topic = function (params) {
    var topic = DATA.topicMap[params[0]];
    if (!topic) return routes.notfound();
    var p = topicProgress(topic);

    return (
      pageHero({
        crumbs: [
          { label: "Trang chủ", href: "#/" },
          { label: "Lộ trình", href: "#/lo-trinh" },
          { label: topic.title }
        ],
        eyebrow: "Chuyên đề " + topic.roman,
        title: esc(topic.title),
        lede: topic.description,
        side: '<span class="chip chip-gold">' + p.done + "/" + p.total + " bài đã học</span>"
      }) +
      '<section class="section tight"><div class="shell">' +
      '<div class="section-head"><div><p class="eyebrow">Danh sách bài</p><h2>Nội dung chuyên đề</h2></div>' +
      "<p>" + esc(topic.short) + ". Hoàn thành từng bài để mở khoá cảm giác tiến bộ rõ ràng.</p></div>" +
      '<div class="lesson-list">' + topic.lessons.map(lessonRow).join("") + "</div>" +
      '<div class="practice-cta" style="margin-top:var(--sp-5)">' +
      "<div><h3>Kiểm tra chuyên đề</h3><p>Làm các câu hỏi của từng bài để kiểm tra mức độ nắm kiến thức.</p></div>" +
      '<div class="cta-actions"><a class="btn btn-primary" href="#/kiem-tra">Chọn bài kiểm tra</a></div>' +
      "</div></div></section>"
    );
  };

  /* ----------------------------- Lesson ----------------------------- */

  routes.lesson = function (params) {
    var lesson = DATA.lessonMap[params[0]];
    if (!lesson) return routes.notfound();

    var topic = topicOf(lesson);
    var done = isDone(lesson.id);
    var best = bestScore(lesson.id);
    var idx = DATA.lessons.indexOf(lesson);
    var prev = DATA.lessons[idx - 1];
    var next = DATA.lessons[idx + 1];

    var toc = lesson.sections.map(function (s, i) {
      return '<a href="#sec-' + i + '" data-toc="sec-' + i + '" data-scroll="sec-' + i + '">' + esc(s.h || "Mục " + (i + 1)) + "</a>";
    }).join("");

    var body = lesson.sections.map(renderSection).join("");

    return (
      '<div class="shell lesson-shell">' +
      '<div class="lesson-grid">' +

      '<aside class="lesson-aside">' +
      '<div class="toc"><div class="toc-label">Trong bài này</div>' + toc + "</div>" +
      '<div class="aside-actions">' +
      '<button class="btn ' + (done ? "btn-secondary" : "btn-primary") + ' btn-sm" type="button" data-action="complete" data-id="' + lesson.id + '">' +
      (done ? "Đã học · Bỏ đánh dấu" : "Đánh dấu đã học") + "</button>" +
      '<a class="btn btn-secondary btn-sm" href="#/quiz/' + lesson.id + '">Làm bài kiểm tra</a>' +
      '<a class="btn btn-ghost btn-sm" href="#/on-tap/' + lesson.id + '">Ôn thẻ ghi nhớ ' + arrowIcon() + "</a>" +
      "</div>" +
      '<div class="aside-note"><strong>Nguồn</strong>' + esc(lesson.source) + "</div>" +
      "</aside>" +

      '<div class="lesson-main">' +
      '<header class="lesson-header">' +
      breadcrumb([
        { label: "Lộ trình", href: "#/lo-trinh" },
        { label: topic.title, href: "#/chuong/" + topic.id },
        { label: "Bài " + lesson.order }
      ]) +
      '<p class="eyebrow" style="margin-top:var(--sp-3)">Bài ' + pad(lesson.order) + " · " + esc(topic.title) + "</p>" +
      "<h1>" + esc(lesson.title) + "</h1>" +
      '<p class="lesson-sub">' + esc(lesson.subtitle) + "</p>" +
      '<div class="lesson-meta">' +
      "<span>" + clockIcon() + lesson.minutes + " phút đọc</span>" +
      "<span>" + quizIcon() + lesson.quiz.length + " câu hỏi</span>" +
      "<span>" + cardsIcon() + lesson.flashcards.length + " thẻ ghi nhớ</span>" +
      (best ? "<span>" + checkIcon() + "Điểm cao nhất: " + best.best + "%</span>" : "") +
      "</div>" +
      "</header>" +

      '<div class="objectives"><h2>Mục tiêu bài học</h2><ul>' +
      lesson.objectives.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") +
      "</ul></div>" +

      body +

      '<div class="keypoints"><h2>Điểm chốt cần nhớ</h2><ul>' +
      lesson.keyPoints.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") +
      "</ul></div>" +

      '<div class="practice-cta">' +
      "<div><h3>Sẵn sàng kiểm tra?</h3><p>" + lesson.quiz.length + " câu hỏi kèm giải thích, có lưu điểm cao nhất của bạn.</p></div>" +
      '<div class="cta-actions">' +
      '<a class="btn btn-primary" href="#/quiz/' + lesson.id + '">Làm bài kiểm tra</a>' +
      '<a class="btn btn-secondary" href="#/on-tap/' + lesson.id + '">Ôn thẻ</a>' +
      "</div></div>" +

      '<nav class="lesson-nav" aria-label="Bài trước và bài sau">' +
      (prev
        ? '<a href="#/bai/' + prev.id + '"><span>Bài trước</span><strong>' + esc(prev.title) + "</strong></a>"
        : '<a href="#/lo-trinh"><span>Quay lại</span><strong>Lộ trình học</strong></a>') +
      (next
        ? '<a class="next" href="#/bai/' + next.id + '"><span>Bài tiếp theo</span><strong>' + esc(next.title) + "</strong></a>"
        : '<a class="next" href="#/quiz/' + lesson.id + '"><span>Kiểm tra</span><strong>Làm bài kiểm tra</strong></a>') +
      "</nav>" +
      "</div></div></div>"
    );
  };

  /* ----------------------------- Quiz ----------------------------- */

  var quiz = null;

  function buildQuiz(key) {
    if (key === "tong-hop") {
      var pool = [];
      DATA.lessons.forEach(function (l) {
        l.quiz.forEach(function (q) {
          pool.push({
            q: q.q,
            options: q.options,
            answer: q.answer,
            explain: q.explain,
            lessonId: l.id,
            lessonTitle: l.title
          });
        });
      });
      pool.sort(function () { return Math.random() - 0.5; });
      return {
        key: key,
        title: "Đề tổng hợp",
        subtitle: pool.length + " câu hỏi ngẫu nhiên từ toàn bộ 18 bài.",
        lessonId: null,
        questions: pool.slice(0, 20)
      };
    }

    var lesson = DATA.lessonMap[key];
    if (!lesson) return null;
    return {
      key: key,
      title: lesson.title,
      subtitle: lesson.subtitle,
      lessonId: lesson.id,
      questions: lesson.quiz.map(function (q) {
        return {
          q: q.q,
          options: q.options,
          answer: q.answer,
          explain: q.explain,
          lessonId: lesson.id,
          lessonTitle: lesson.title
        };
      })
    };
  }

  function startQuiz(key) {
    var built = buildQuiz(key);
    if (!built) return null;
    quiz = {
      meta: built,
      index: 0,
      answers: [],
      selected: null,
      finished: false
    };
    built.questions.forEach(function () {
      quiz.answers.push(null);
    });
    return quiz;
  }

  function quizResult() {
    var correct = 0;
    quiz.meta.questions.forEach(function (q, i) {
      if (quiz.answers[i] === q.answer) correct++;
    });
    return {
      correct: correct,
      total: quiz.meta.questions.length,
      pct: Math.round((correct / quiz.meta.questions.length) * 100)
    };
  }

  routes.quiz = function (params) {
    var key = params[0] || "";
    if (!quiz || !quiz.meta || quiz.meta.key !== key) {
      startQuiz(key);
    }
    if (!quiz) return routes.notfound();

    if (quiz.finished) return quizResultView();

    var q = quiz.meta.questions[quiz.index];
    var chosen = quiz.answers[quiz.index];
    var total = quiz.meta.questions.length;
    var position = quiz.index + 1;

    var options = q.options.map(function (opt, i) {
      var cls = "option";
      if (chosen !== null) {
        if (i === q.answer) cls += " correct";
        else if (i === chosen) cls += " wrong";
      }
      return (
        '<button class="' + cls + '" type="button" data-action="quiz-option" data-index="' + i + '"' +
        (chosen !== null ? " disabled" : "") + ">" +
        '<span class="opt-letter">' + "ABCD"[i] + "</span>" +
        "<span>" + esc(opt) + "</span></button>"
      );
    }).join("");

    return (
      '<div class="shell quiz-shell">' +
      '<div class="quiz-head">' +
      breadcrumb([
        { label: "Kiểm tra", href: "#/kiem-tra" },
        { label: quiz.meta.title }
      ]) +
      '<p class="eyebrow" style="margin-top:var(--sp-3)">' + (quiz.meta.lessonId ? "Kiểm tra bài học" : "Kiểm tra tổng hợp") + "</p>" +
      '<h1 style="font-size:clamp(34px,4.6vw,52px);font-weight:500;line-height:1.05">' + esc(quiz.meta.title) + "</h1>" +
      "</div>" +
      '<div class="quiz-progress"><span class="qp-count">Câu ' + position + " / " + total + "</span>" +
      '<span class="qp-bar"><i style="width:' + Math.round(((quiz.index) / total) * 100) + '%"></i></span>' +
      '<span class="qp-count">' + (quiz.meta.lessonId ? "Bài " + DATA.lessonMap[quiz.meta.lessonId].order : "Tổng hợp") + "</span></div>" +

      '<div class="question-card">' +
      '<div class="question-num">Câu hỏi ' + pad(position) + "</div>" +
      '<h2 class="question-text">' + esc(q.q) + "</h2>" +
      '<div class="options">' + options + "</div>" +
      (chosen !== null
        ? '<div class="explain"><strong>Giải thích</strong>' + esc(q.explain) + "</div>"
        : "") +
      "</div>" +

      '<div class="quiz-footer">' +
      '<span class="hint">' + (chosen === null ? "Chọn một đáp án để xem giải thích." : "Đáp án đã được ghi lại.") + "</span>" +
      '<div style="display:flex;gap:10px">' +
      (quiz.index > 0 ? '<button class="btn btn-secondary" type="button" data-action="quiz-prev">Câu trước</button>' : "") +
      '<button class="btn btn-primary" type="button" data-action="quiz-next"' + (chosen === null ? " disabled" : "") + ">" +
      (position === total ? "Xem kết quả" : "Câu tiếp theo") + arrowIcon() + "</button>" +
      "</div></div>" +
      "</div>"
    );
  };

  function quizResultView() {
    var result = quizResult();
    var message =
      result.pct >= 90 ? "Xuất sắc. Kiến thức đã rất vững." :
      result.pct >= 70 ? "Khá tốt. Xem lại vài câu sai là ổn." :
      result.pct >= 50 ? "Đã nắm một nửa. Nên đọc lại bài trước khi làm lại." :
      "Đừng lo. Hãy quay lại phần lý thuyết và ví dụ rồi thử lại.";

    var review = quiz.meta.questions.map(function (q, i) {
      var ans = quiz.answers[i];
      var ok = ans === q.answer;
      return (
        '<div class="review-item ' + (ok ? "ok" : "no") + '">' +
        '<div class="ri-q"><span class="ri-icon">' + (ok ? "✓" : "×") + "</span>" +
        "<span>" + esc(q.q) + "</span></div>" +
        '<div class="ri-a">Đáp án đúng: <strong>' + "ABCD"[q.answer] + ". " + esc(q.options[q.answer]) + "</strong>" +
        (ok ? "" : " — Bạn chọn: " + (ans === null ? "chưa trả lời" : "ABCD"[ans] + ". " + esc(q.options[ans]))) +
        "</div></div>"
      );
    }).join("");

    return (
      '<div class="shell quiz-shell">' +
      '<div class="result-card">' +
      '<div class="result-ring">' + ring(result.pct, 120, 54) +
      '<div class="result-num">' + result.pct + "%</div></div>" +
      "<h2>" + (result.pct >= 70 ? "Hoàn thành tốt" : "Đã hoàn thành") + "</h2>" +
      '<p class="result-sub">' + esc(message) + "</p>" +
      '<div class="result-stats">' +
      "<div><strong>" + result.correct + "</strong><span>Câu đúng</span></div>" +
      "<div><strong>" + (result.total - result.correct) + "</strong><span>Câu sai</span></div>" +
      "<div><strong>" + result.total + "</strong><span>Tổng câu</span></div>" +
      "</div>" +
      '<div class="result-actions">' +
      '<button class="btn btn-primary" type="button" data-action="quiz-restart">Làm lại</button>' +
      '<a class="btn btn-secondary" href="#/kiem-tra">Chọn bài khác</a>' +
      (quiz.meta.lessonId ? '<a class="btn btn-ghost" href="#/bai/' + quiz.meta.lessonId + '">Đọc lại lý thuyết</a>' : "") +
      "</div>" +

      '<div class="answer-review"><h3>Xem lại đáp án</h3>' + review + "</div>" +
      "</div></div>"
    );
  }

  routes.quizzes = function () {
    var cards = DATA.lessons.map(function (l) {
      var best = bestScore(l.id);
      return (
        '<a class="quiz-card" href="#/quiz/' + l.id + '">' +
        '<div class="qc-top"><span class="mono">Bài ' + pad(l.order) + " · " + esc(topicOf(l).title) + "</span>" +
        (best ? '<span class="chip chip-success">' + best.best + "%</span>" : '<span class="chip">Chưa làm</span>') +
        "</div>" +
        "<h3>" + esc(l.title) + "</h3>" +
        "<p>" + esc(l.subtitle) + "</p>" +
        '<div class="qc-foot"><span>' + l.quiz.length + " câu hỏi</span><strong>" + (best ? "Làm lại →" : "Bắt đầu →") + "</strong></div>" +
        "</a>"
      );
    }).join("");

    return (
      pageHero({
        crumbs: [{ label: "Trang chủ", href: "#/" }, { label: "Kiểm tra" }],
        eyebrow: "Kiểm tra",
        title: "Kiểm tra để biết mình đang ở đâu",
        lede: "Mỗi bài có bộ câu hỏi riêng kèm giải thích. Điểm cao nhất được lưu trên thiết bị này để bạn theo dõi tiến bộ.",
        side: '<a class="btn btn-primary btn-sm" href="#/quiz/tong-hop">Thi tổng hợp 20 câu</a>'
      }) +
      '<section class="section tight"><div class="shell">' +
      '<div class="practice-cta" style="margin-top:0">' +
      "<div><h3>Đề tổng hợp ngẫu nhiên</h3><p>20 câu trộn từ cả 18 bài — mô phỏng cảm giác làm đề thật.</p></div>" +
      '<div class="cta-actions"><a class="btn btn-primary" href="#/quiz/tong-hop">Bắt đầu</a></div>' +
      "</div>" +
      '<div class="section-head" style="margin-top:var(--sp-5)"><div><p class="eyebrow">Theo bài</p><h2>Chọn bài để kiểm tra</h2></div>' +
      "<p>Nên làm sau khi đọc lý thuyết và xem ví dụ. Câu sai sẽ dẫn bạn về đúng phần cần ôn.</p></div>" +
      '<div class="quiz-grid">' + cards + "</div>" +
      "</div></section>"
    );
  };

  /* ----------------------------- Review / Flashcards ----------------------------- */

  var flash = {
    lessonId: null,
    topic: "all",
    mode: "all", /* all | unknown */
    index: 0,
    flipped: false,
    deck: []
  };

  function cardKey(card) {
    return card.lessonId + "#" + card.i;
  }

  function buildDeck() {
    var deck = [];
    DATA.lessons.forEach(function (l) {
      if (flash.lessonId && l.id !== flash.lessonId) return;
      if (flash.topic !== "all" && l.topic !== flash.topic) return;
      l.flashcards.forEach(function (c, i) {
        deck.push({
          lessonId: l.id,
          lessonTitle: l.title,
          source: l.source,
          i: i,
          q: c.q,
          a: c.a
        });
      });
    });
    if (flash.mode === "unknown") {
      deck = deck.filter(function (c) {
        return !state.known[cardKey(c)];
      });
    }
    return deck;
  }

  function refreshDeck(resetIndex) {
    flash.deck = buildDeck();
    if (resetIndex || flash.index >= flash.deck.length) flash.index = 0;
    flash.flipped = false;
  }

  function knownCount() {
    return Object.keys(state.known).length;
  }

  function flashView() {
    var current = flash.deck[flash.index];
    var total = flash.deck.length;

    if (!current) {
      return (
        '<div class="empty"><h3>Đã nhớ hết thẻ trong phạm vi này</h3>' +
        "<p>Chuyển sang “Tất cả thẻ” hoặc chọn chuyên đề khác để ôn tiếp.</p>" +
        '<div class="result-actions"><button class="btn btn-secondary" type="button" data-action="review-mode" data-mode="all">Xem tất cả thẻ</button>' +
        '<a class="btn btn-primary" href="#/kiem-tra">Làm bài kiểm tra</a></div></div>'
      );
    }

    var known = !!state.known[cardKey(current)];

    return (
      '<div class="flash-stage">' +
      '<div class="flashcard-wrap">' +
      '<div class="flashcard' + (flash.flipped ? " flipped" : "") + '" id="flashcard" data-action="flash-flip" role="button" tabindex="0" aria-label="Lật thẻ ghi nhớ">' +
      '<div class="flashcard-inner">' +
      '<div class="flash-face flash-front"><span class="flash-label">Câu hỏi</span>' +
      '<span class="flash-text">' + esc(current.q) + "</span>" +
      '<span class="flash-source">' + esc(current.lessonTitle) + " · " + esc(current.source) + "</span></div>" +
      '<div class="flash-face flash-back"><span class="flash-label">Trả lời</span>' +
      '<span class="flash-text">' + esc(current.a) + "</span>" +
      '<span class="flash-source">' + (known ? "Đã đánh dấu nhớ" : "Chưa đánh dấu") + "</span></div>" +
      "</div></div>" +
      '<p class="flash-hint">Nhấn vào thẻ để lật mặt sau</p>' +
      "</div>" +

      '<div class="flash-controls">' +
      '<button class="btn btn-secondary btn-sm" type="button" data-action="flash-prev" aria-label="Thẻ trước">←</button>' +
      '<span class="flash-counter">' + (flash.index + 1) + " / " + total + "</span>" +
      '<button class="btn btn-secondary btn-sm" type="button" data-action="flash-next" aria-label="Thẻ sau">→</button>' +
      "</div>" +

      (flash.deck.length <= 24
        ? '<div class="flash-dots" aria-hidden="true">' +
          flash.deck.map(function (c, i) {
            return '<i class="' + (i === flash.index ? "on" : "") + '"></i>';
          }).join("") + "</div>"
        : "") +

      '<div class="flash-actions">' +
      '<button class="btn btn-secondary" type="button" data-action="flash-unknown">Chưa nhớ · xem lại sau</button>' +
      '<button class="btn btn-primary" type="button" data-action="flash-known">' +
      (known ? "Đã nhớ · tiếp tục" : "Đã nhớ · tiếp tục") + arrowIcon() + "</button>" +
      "</div>" +
      "</div>"
    );
  }

  routes.review = function (params) {
    var presetLesson = params[0];
    if (presetLesson && DATA.lessonMap[presetLesson]) {
      if (flash.lessonId !== presetLesson) {
        flash.lessonId = presetLesson;
        refreshDeck(true);
      }
    } else if (flash.lessonId) {
      flash.lessonId = null;
      refreshDeck(true);
    }

    if (!flash.deck.length) refreshDeck(true);

    var lesson = flash.lessonId ? DATA.lessonMap[flash.lessonId] : null;

    var topicOptions = '<option value="all">Tất cả chuyên đề</option>' + DATA.topics.map(function (t) {
      return '<option value="' + t.id + '"' + (flash.topic === t.id ? " selected" : "") + ">" + esc(t.title) + "</option>";
    }).join("");

    return (
      pageHero({
        crumbs: [{ label: "Trang chủ", href: "#/" }, { label: "Ôn tập" }],
        eyebrow: "Ôn lại kiến thức",
        title: lesson ? "Thẻ ghi nhớ: " + esc(lesson.title) : "Ôn nhanh, nhớ lâu",
        lede: lesson
          ? "Bộ thẻ của bài này giúp bạn tự kiểm tra trước khi làm bài kiểm tra."
          : "Lật thẻ để tự trả lời, đánh dấu “đã nhớ” và quay lại những thẻ còn quên. Mọi tiến độ được lưu trên thiết bị.",
        side: '<a class="btn btn-secondary btn-sm" href="#/kiem-tra">Làm bài kiểm tra</a>'
      }) +
      '<section class="section tight"><div class="shell">' +
      '<div class="review-toolbar">' +
      '<div class="segmented" role="group" aria-label="Phạm vi ôn tập">' +
      '<button type="button" class="' + (flash.mode === "all" ? "active" : "") + '" data-action="review-mode" data-mode="all">Tất cả thẻ</button>' +
      '<button type="button" class="' + (flash.mode === "unknown" ? "active" : "") + '" data-action="review-mode" data-mode="unknown">Chưa nhớ</button>' +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">' +
      '<span class="mono" style="color:var(--muted-soft)">' + knownCount() + " thẻ đã nhớ</span>" +
      '<label class="select-wrap">Chuyên đề' +
      '<select id="reviewTopic" data-action="review-topic">' + topicOptions + "</select></label>" +
      "</div></div>" +
      (lesson
        ? '<div class="form-note" style="margin-bottom:var(--sp-3)"><span>Đang ôn riêng bài <strong>' + esc(lesson.title) + '</strong>.</span> <a href="#/on-tap" style="text-decoration:underline;text-underline-offset:3px">Ôn tất cả</a></div>'
        : "") +
      flashView() +
      "</div></section>"
    );
  };

  /* ----------------------------- Progress ----------------------------- */

  routes.progress = function () {
    var pct = progressPercent();
    var done = completedCount();
    var quizDone = Object.keys(state.quiz).length;
    var avg = 0;
    var scores = Object.keys(state.quiz).map(function (k) { return state.quiz[k].best; });
    if (scores.length) {
      avg = Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length);
    }

    var rows = DATA.topics.map(function (t) {
      var p = topicProgress(t);
      return (
        '<div class="progress-topic">' +
        '<span class="pt-roman">' + esc(t.roman) + "</span>" +
        "<div><h3>" + esc(t.title) + "</h3><p>" + p.done + "/" + p.total + " bài đã hoàn thành</p></div>" +
        '<span class="pt-bar"><i style="width:' + p.pct + '%"></i></span>' +
        '<span class="pt-pct">' + p.pct + "%</span>" +
        "</div>"
      );
    }).join("");

    var doneLessons = DATA.lessons.filter(function (l) { return isDone(l.id); });

    return (
      pageHero({
        crumbs: [{ label: "Trang chủ", href: "#/" }, { label: "Tiến độ" }],
        eyebrow: "Tiến độ của tôi",
        title: "Bạn đã đi được <span class=\"ital gold\">" + pct + "%</span> chặng đường",
        lede: "Dữ liệu được lưu cục bộ trên thiết bị này. Xoá dữ liệu trình duyệt sẽ đặt lại toàn bộ tiến độ.",
        side: '<button class="btn btn-secondary btn-sm" type="button" data-action="reset-progress">Đặt lại tiến độ</button>'
      }) +
      '<section class="section tight"><div class="shell">' +
      '<div class="progress-hero">' +
      '<div class="progress-ring-lg">' + ring(pct, 160, 68) +
      '<div class="pr-num">' + pct + "%</div></div>" +
      '<div class="progress-stats">' +
      '<div class="progress-stat"><strong>' + done + "/" + DATA.lessons.length + "</strong><span>Bài đã học</span></div>" +
      '<div class="progress-stat"><strong>' + quizDone + "</strong><span>Bài đã kiểm tra</span></div>" +
      '<div class="progress-stat"><strong>' + avg + "%</strong><span>Điểm trung bình</span></div>" +
      "</div></div>" +

      '<div class="section-head" style="margin-top:var(--sp-6)"><div><p class="eyebrow">Theo chuyên đề</p><h2>Bản đồ tiến độ</h2></div>' +
      "<p>Nhìn nhanh chuyên đề nào đã vững, chuyên đề nào còn trống để lên kế hoạch học tiếp.</p></div>" +
      '<div class="progress-topic-list">' + rows + "</div>" +

      '<div class="section-head" style="margin-top:var(--sp-6)"><div><p class="eyebrow">Đã hoàn thành</p><h2>Bài học của bạn</h2></div>' +
      "<p>" + (doneLessons.length ? "Danh sách bài đã đánh dấu học xong." : "Chưa có bài nào. Hãy bắt đầu từ bài đầu tiên trong lộ trình.") + "</p></div>" +
      (doneLessons.length
        ? '<div class="lesson-list">' + doneLessons.map(lessonRow).join("") + "</div>"
        : '<div class="empty"><h3>Chưa có bài nào được đánh dấu</h3><p>Hoàn thành một bài và nhấn “Đánh dấu đã học” để bắt đầu theo dõi.</p>' +
          '<div class="result-actions"><a class="btn btn-primary" href="#/lo-trinh">Vào lộ trình</a></div></div>') +
      "</div></section>"
    );
  };

  /* ----------------------------- AI placeholder ----------------------------- */

  routes.ai = function () {
    return (
      '<section class="ai-hero"><div class="shell">' +
      '<p class="eyebrow">AI luyện tập</p>' +
      '<h1 style="font-size:clamp(40px,6vw,70px);font-weight:500;line-height:1;letter-spacing:-0.02em;max-width:820px">Bài tập may đo cho <span class="ital gold">đúng chỗ bạn yếu</span></h1>' +
      '<p class="page-lede">Tính năng đang được phát triển. Khi hoàn thiện, AI sẽ tạo câu hỏi mới theo chuyên đề, mức độ và dạng câu bạn chọn — kèm đáp án và giải thích.</p>' +
      "</div></section>" +
      '<div class="shell ai-grid">' +
      '<div class="ai-form">' +
      "<h2>Tạo bài tập của bạn</h2>" +
      '<p class="form-intro">Biểu mẫu dưới đây minh hoạ cách tính năng sẽ hoạt động.</p>' +
      '<div class="field"><label for="aiTopic">Chuyên đề</label>' +
      '<select id="aiTopic" disabled>' + DATA.topics.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.title) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="field-row">' +
      '<div class="field"><label for="aiLevel">Mức độ</label><select id="aiLevel" disabled>' +
      "<option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option></select></div>" +
      '<div class="field"><label for="aiCount">Số câu</label><select id="aiCount" disabled>' +
      "<option>5 câu</option><option>10 câu</option><option>15 câu</option></select></div>" +
      "</div>" +
      '<div class="field"><label for="aiFocus">Bạn muốn luyện điều gì?</label>' +
      '<textarea id="aiFocus" disabled placeholder="Ví dụ: phân biệt ẩn dụ và hoán dụ; sửa lỗi thiếu chủ ngữ; đọc hiểu văn bản thông tin…"></textarea></div>' +
      '<button class="btn btn-primary btn-block" type="button" data-action="ai-generate" aria-disabled="true">Tạo bài tập với AI</button>' +
      '<div class="form-note"><span>i</span><span>Tính năng chưa khả dụng. Trong lúc chờ, hãy dùng kho bài kiểm tra có sẵn — nội dung đã được biên soạn theo đúng cấu trúc đề.</span></div>' +
      "</div>" +
      '<aside class="ai-side">' +
      "<h2>Kế hoạch phát triển</h2>" +
      '<ul class="roadmap-list">' +
      '<li><span class="rl-num">01</span><div><strong>Tạo câu hỏi theo chuyên đề</strong><p>Sinh câu hỏi mới dựa trên 18 bài lý thuyết, không lặp lại kho hiện có.</p></div></li>' +
      '<li><span class="rl-num">02</span><div><strong>Điều chỉnh độ khó</strong><p>Chọn mức nhận biết, thông hiểu, vận dụng; tăng dần theo tiến độ.</p></div></li>' +
      '<li><span class="rl-num">03</span><div><strong>Giải thích từng đáp án</strong><p>Không chỉ báo đúng/sai mà chỉ ra lỗi sai và phần lý thuyết liên quan.</p></div></li>' +
      '<li><span class="rl-num">04</span><div><strong>Cá nhân hoá theo lỗi sai</strong><p>Đề xuất bài ôn dựa trên các câu bạn làm sai nhiều lần.</p></div></li>' +
      "</ul>" +
      '<a class="btn btn-secondary btn-block" href="#/kiem-tra" style="margin-top:var(--sp-4)">Luyện với kho câu hỏi hiện có</a>' +
      "</aside></div>"
    );
  };

  routes.notfound = function () {
    return (
      '<section class="section"><div class="shell">' +
      '<div class="empty" style="max-width:640px;margin:0 auto">' +
      "<h3>Không tìm thấy trang</h3>" +
      "<p>Đường dẫn có thể đã thay đổi. Hãy quay về trang chủ hoặc lộ trình học.</p>" +
      '<div class="result-actions"><a class="btn btn-primary" href="#/">Về trang chủ</a>' +
      '<a class="btn btn-secondary" href="#/lo-trinh">Xem lộ trình</a></div>' +
      "</div></div></section>"
    );
  };

  /* ----------------------------- Search ----------------------------- */

  var searchIndex = null;

  function buildSearchIndex() {
    searchIndex = DATA.lessons.map(function (l) {
      var chunks = []
        .concat(l.subtitle ? [l.subtitle] : [])
        .concat(l.keywords || [])
        .concat(l.objectives || [])
        .concat(l.keyPoints || [])
        .concat(
          l.sections.map(function (s) {
            return (s.h ? s.h + ". " : "") + (s.p || []).join(" ");
          })
        )
        .concat(
          (l.flashcards || []).map(function (c) {
            return c.q;
          })
        );

      var haystack = [l.title]
        .concat(chunks)
        .join(" ")
        .toLowerCase();

      return { lesson: l, text: haystack, chunks: chunks };
    });
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  }

  function search(query) {
    if (!searchIndex) buildSearchIndex();
    var q = normalize(query.trim());
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);

    function hasWord(haystack, term) {
      return new RegExp("(^|[^a-z0-9])" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)").test(haystack);
    }

    function snippetFor(item, fullQuery, terms) {
      var chunks = item.chunks || [];
      var found = null;

      function pick(predicate) {
        for (var i = 0; i < chunks.length; i++) {
          if (predicate(normalize(chunks[i]))) return chunks[i];
        }
        return null;
      }

      /* Ưu tiên đoạn khớp trọn cụm từ khoá, sau đó tới từ dài nhất */
      found = pick(function (norm) { return norm.indexOf(fullQuery) !== -1; });
      if (!found) {
        var longest = terms.slice().sort(function (a, b) { return b.length - a.length; })[0];
        if (longest) found = pick(function (norm) { return norm.indexOf(longest) !== -1; });
      }
      if (!found) return "";
      found = found.replace(/\s+/g, " ").trim();
      if (found.length > 120) found = found.slice(0, 117).replace(/\s+\S*$/, "") + "…";
      return found;
    }

    return searchIndex
      .map(function (item) {
        var normTitle = normalize(item.lesson.title);
        var normKeywords = normalize((item.lesson.keywords || []).join(" "));
        var normText = normalize(item.lesson.subtitle + " " + item.text);
        var score = 0;
        var matched = 0;

        /* Ưu tiên tuyệt đối cho cụm từ khớp nguyên vẹn */
        if (normTitle.indexOf(q) !== -1) score += 40;
        else if (normText.indexOf(q) !== -1) score += 18;

        terms.forEach(function (t) {
          if (hasWord(normTitle, t)) { score += 8; matched++; }
          else if (hasWord(normKeywords, t)) { score += 4; matched++; }
          else if (hasWord(normText, t)) { score += 1; matched++; }
        });

        /* Với truy vấn nhiều từ, yêu cầu khớp đủ để tránh kết quả nhiễu */
        if (matched < terms.length) score = 0;

        return { lesson: item.lesson, score: score, snippet: score ? snippetFor(item, q, terms) : "" };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 8);
  }

  var searchState = { active: 0, results: [] };

  function openSearch() {
    var overlay = $("#searchOverlay");
    if (!overlay) return;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    var input = $("#searchInput");
    if (input) {
      input.value = "";
      input.focus();
    }
    renderSearchResults("");
  }

  function closeSearch() {
    var overlay = $("#searchOverlay");
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function renderSearchResults(query) {
    var results = search(query);
    searchState.results = results;
    searchState.active = 0;

    var box = $("#searchResults");
    var hint = $("#searchHint");
    if (!box) return;

    if (!query.trim()) {
      box.innerHTML = "";
      if (hint) {
        hint.textContent = "Nhập từ khoá để tìm trong " + DATA.lessons.length + " bài học.";
        hint.style.display = "";
      }
      return;
    }

    if (!results.length) {
      box.innerHTML = "";
      if (hint) {
        hint.textContent = "Không tìm thấy kết quả cho “" + query + "”. Thử từ khoá ngắn hơn.";
        hint.style.display = "";
      }
      return;
    }

    if (hint) hint.style.display = "none";

    box.innerHTML = results.map(function (r, i) {
      return (
        '<a class="search-result' + (i === 0 ? " active" : "") + '" href="#/bai/' + r.lesson.id + '" data-result="' + i + '">' +
        '<span class="sr-num">' + pad(r.lesson.order) + "</span>" +
        '<span class="sr-main"><strong>' + esc(r.lesson.title) + "</strong><span>" + esc(topicOf(r.lesson).title) + "</span>" +
        (r.snippet ? '<span class="sr-snippet">' + esc(r.snippet) + "</span>" : "") +
        "</span>" +
        '<span class="sr-arrow">→</span></a>'
      );
    }).join("");
  }

  function moveSearchActive(delta) {
    var items = $all(".search-result");
    if (!items.length) return;
    searchState.active = (searchState.active + delta + items.length) % items.length;
    items.forEach(function (el, i) {
      el.classList.toggle("active", i === searchState.active);
    });
    items[searchState.active].scrollIntoView({ block: "nearest" });
  }

  /* ----------------------------- Events ----------------------------- */

  function onAppClick(event) {
    var target = event.target.closest("[data-action]");
    if (!target) return;
    var action = target.getAttribute("data-action");

    if (action === "complete") {
      var id = target.getAttribute("data-id");
      var idx = state.done.indexOf(id);
      if (idx === -1) {
        state.done.push(id);
        write(STORE.done, state.done);
        toast("Đã đánh dấu hoàn thành: " + DATA.lessonMap[id].title);
      } else {
        state.done.splice(idx, 1);
        write(STORE.done, state.done);
        toast("Đã bỏ đánh dấu bài học.");
      }
      render(true);
      return;
    }

    if (action === "quiz-option") {
      if (!quiz || quiz.finished || quiz.answers[quiz.index] !== null) return;
      var choice = parseInt(target.getAttribute("data-index"), 10);
      quiz.answers[quiz.index] = choice;
      render(true);
      return;
    }

    if (action === "quiz-next") {
      if (!quiz) return;
      if (quiz.answers[quiz.index] === null) return;
      if (quiz.index < quiz.meta.questions.length - 1) {
        quiz.index += 1;
        render(true);
      } else {
        finishQuiz();
      }
      return;
    }

    if (action === "quiz-prev") {
      if (!quiz || quiz.index === 0) return;
      quiz.index -= 1;
      render(true);
      return;
    }

    if (action === "quiz-restart") {
      if (!quiz) return;
      startQuiz(quiz.meta.key);
      render(true);
      return;
    }

    if (action === "review-mode") {
      flash.mode = target.getAttribute("data-mode") || "all";
      refreshDeck(true);
      render(true);
      return;
    }

    if (action === "flash-flip") {
      flash.flipped = !flash.flipped;
      target.classList.toggle("flipped", flash.flipped);
      return;
    }

    if (action === "flash-next") {
      if (!flash.deck.length) return;
      flash.index = (flash.index + 1) % flash.deck.length;
      flash.flipped = false;
      render(true);
      return;
    }

    if (action === "flash-prev") {
      if (!flash.deck.length) return;
      flash.index = (flash.index - 1 + flash.deck.length) % flash.deck.length;
      flash.flipped = false;
      render(true);
      return;
    }

    if (action === "flash-known" || action === "flash-unknown") {
      var card = flash.deck[flash.index];
      if (!card) return;
      var k = cardKey(card);
      if (action === "flash-known") {
        state.known[k] = true;
      } else {
        delete state.known[k];
      }
      write(STORE.known, state.known);

      if (flash.mode === "unknown") {
        refreshDeck(false);
        if (flash.index >= flash.deck.length) flash.index = 0;
      } else {
        flash.index = (flash.index + 1) % flash.deck.length;
      }
      flash.flipped = false;
      render(true);
      return;
    }

    if (action === "reset-progress") {
      if (!window.confirm("Đặt lại toàn bộ tiến độ học, điểm kiểm tra và thẻ đã nhớ?")) return;
      state.done = [];
      state.quiz = {};
      state.known = {};
      write(STORE.done, state.done);
      write(STORE.quiz, state.quiz);
      write(STORE.known, state.known);
      toast("Đã đặt lại tiến độ.");
      render(true);
      return;
    }

    if (action === "ai-generate") {
      toast("Tính năng AI đang được phát triển. Hãy dùng kho bài kiểm tra có sẵn.");
      return;
    }
  }

  function finishQuiz() {
    var result = quizResult();
    quiz.finished = true;

    var key = quiz.meta.lessonId || "tong-hop";
    if (quiz.meta.lessonId) {
      var prev = state.quiz[key];
      if (!prev || result.pct > prev.best) {
        state.quiz[key] = {
          best: result.pct,
          correct: result.correct,
          total: result.total,
          at: Date.now()
        };
        write(STORE.quiz, state.quiz);
      }
    }
    render(false);
  }

  function onAppChange(event) {
    if (event.target.id === "reviewTopic") {
      flash.topic = event.target.value;
      flash.lessonId = null;
      if (location.hash !== "#/on-tap") {
        history.replaceState(null, "", "#/on-tap");
      }
      refreshDeck(true);
      render(true);
    }
  }

  function initScrollLinks() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-scroll]");
      if (!link) return;
      var el = document.getElementById(link.getAttribute("data-scroll"));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      $all("[data-toc]").forEach(function (a) {
        a.classList.toggle("active", a === link);
      });
    });

    document.addEventListener("click", function (e) {
      var skip = e.target.closest("[data-skip]");
      if (!skip) return;
      e.preventDefault();
      var app = document.getElementById("app");
      if (app) {
        app.focus();
        app.scrollIntoView({ block: "start" });
      }
    });

    document.addEventListener("keydown", function (e) {
      var card = document.getElementById("flashcard");
      if (!card) return;
      if (document.activeElement !== card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flash.flipped = !flash.flipped;
        card.classList.toggle("flipped", flash.flipped);
      }
    });
  }

  function initSearch() {
    var trigger = $(".search-trigger");
    if (trigger) trigger.addEventListener("click", openSearch);

    var close = $("#searchClose");
    if (close) close.addEventListener("click", closeSearch);

    var overlay = $("#searchOverlay");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeSearch();
      });
    }

    var resultBox = $("#searchResults");
    if (resultBox) {
      resultBox.addEventListener("click", function (e) {
        if (e.target.closest(".search-result")) closeSearch();
      });
    }

    var input = $("#searchInput");
    if (input) {
      input.addEventListener("input", function () {
        renderSearchResults(input.value);
      });

      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          moveSearchActive(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          moveSearchActive(-1);
        } else if (e.key === "Enter") {
          var first = searchState.results[searchState.active];
          if (first) {
            closeSearch();
            location.hash = "#/bai/" + first.lesson.id;
          }
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && overlay && overlay.hidden) {
        var tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
          openSearch();
        }
      }
      if (e.key === "Escape" && overlay && !overlay.hidden) {
        closeSearch();
      }
    });
  }

  function initHeader() {
    var trigger = $("#menuTrigger");
    var nav = $("#mobileNav");
    if (!trigger || !nav) return;

    trigger.addEventListener("click", function () {
      var open = nav.hidden;
      nav.hidden = !open;
      nav.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      trigger.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.hidden = true;
        nav.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    window.addEventListener("scroll", function () {
      var header = $("#siteHeader");
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    }, { passive: true });
  }

  function initScrollSpy() {
    window.addEventListener("scroll", function () {
      var toc = $(".toc");
      if (!toc) return;
      var links = $all("[data-toc]");
      if (!links.length) return;

      var offset = 160;
      var current = links[0].getAttribute("data-toc");
      links.forEach(function (link) {
        var id = link.getAttribute("data-toc");
        var section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= offset) {
          current = id;
        }
      });

      links.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("data-toc") === current);
      });
    }, { passive: true });
  }

  /* ----------------------------- Boot ----------------------------- */

  /* Tên tuyến trên thanh địa chỉ → hàm dựng giao diện */
  routes["lo-trinh"] = routes.roadmap;
  routes["chuong"] = routes.topic;
  routes["bai"] = routes.lesson;
  routes["on-tap"] = routes.review;
  routes["kiem-tra"] = routes.quizzes;
  routes["tien-do"] = routes.progress;

  function boot() {
    if (!DATA.lessons.length) {
      $("#app").innerHTML =
        '<section class="section"><div class="shell"><div class="empty"><h3>Chưa tải được dữ liệu bài học</h3><p>Kiểm tra rằng các tệp <code>data-lessons-*.js</code> đã được tải đúng thứ tự.</p></div></div></section>';
      return;
    }

    window.addEventListener("hashchange", function () {
      /* Đổi tuyến khác thì đưa trang về đầu; đổi trong cùng tuyến giữ vị trí. */
      var route = parseRoute();
      var key = route.name + "/" + route.params.join("/");
      closeSearch();
      /* Vào lại một bài kiểm tra từ ngoài thì bắt đầu lượt mới. */
      if (route.name === "quiz" && key !== currentRouteKey) {
        quiz = null;
      }
      render(key === currentRouteKey);
    });

    document.addEventListener("click", onAppClick);
    document.addEventListener("change", onAppChange);

    initHeader();
    initSearch();
    initScrollSpy();
    initScrollLinks();

    if (!location.hash) {
      history.replaceState(null, "", "#/");
    }
    render(false);
    updateRing();

    /* Lưu bài đang đọc để lần sau quay lại */
    window.addEventListener("hashchange", function () {
      var route = parseRoute();
      if (route.name === "lesson" && route.params[0]) {
        write(STORE.last, route.params[0]);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
