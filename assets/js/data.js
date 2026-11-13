/* V-ACT Tiếng Việt — Ghép dữ liệu chuyên đề và bài học */
(function () {
  "use strict";

  var topics = window.VACT_TOPICS || [];
  var lessons = []
    .concat(window.VACT_LESSONS_A || [])
    .concat(window.VACT_LESSONS_B || [])
    .concat(window.VACT_LESSONS_C || []);

  lessons.sort(function (a, b) {
    return a.order - b.order;
  });

  /* Phân bố vị trí đáp án đúng đều khắp A–D: tạo danh sách vị trí
     cân bằng rồi xáo trộn cố định, sau đó hoán đổi phương án đúng
     vào vị trí đã chọn. Cách này giữ nguyên nội dung câu hỏi và
     tránh việc đáp án luôn rơi vào cùng một chỗ. */
  function seededRandom(seed) {
    var t = seed + 0x6d2b79f5;
    return function () {
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var allQuestions = [];
  lessons.forEach(function (lesson) {
    (lesson.quiz || []).forEach(function (question) {
      allQuestions.push(question);
    });
  });

  var targets = allQuestions.map(function (_, i) {
    return i % 4;
  });
  var random = seededRandom(20241113);
  for (var t = targets.length - 1; t > 0; t--) {
    var j = Math.floor(random() * (t + 1));
    var swap = targets[t];
    targets[t] = targets[j];
    targets[j] = swap;
  }

  allQuestions.forEach(function (question, index) {
    var target = targets[index];
    if (question.answer === target) return;
    var correct = question.options[question.answer];
    question.options[question.answer] = question.options[target];
    question.options[target] = correct;
    question.answer = target;
  });

  var topicMap = {};
  topics.forEach(function (t) {
    t.lessons = [];
    topicMap[t.id] = t;
  });

  var lessonMap = {};
  lessons.forEach(function (l) {
    lessonMap[l.id] = l;
    if (topicMap[l.topic]) {
      topicMap[l.topic].lessons.push(l);
    }
  });

  topics.forEach(function (t) {
    t.lessons.sort(function (a, b) {
      return a.order - b.order;
    });
  });

  window.VACT = {
    topics: topics,
    lessons: lessons,
    topicMap: topicMap,
    lessonMap: lessonMap,
    totalMinutes: lessons.reduce(function (sum, l) {
      return sum + (l.minutes || 0);
    }, 0),
    totalQuiz: lessons.reduce(function (sum, l) {
      return sum + ((l.quiz && l.quiz.length) || 0);
    }, 0),
    totalCards: lessons.reduce(function (sum, l) {
      return sum + ((l.flashcards && l.flashcards.length) || 0);
    }, 0)
  };
})();
