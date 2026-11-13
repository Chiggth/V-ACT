# V-ACT Tiếng Việt

Website tĩnh ôn thi môn Tiếng Việt cho kỳ thi Đánh giá năng lực, được biên soạn từ bộ 8 tài liệu V-ACT. Toàn bộ giao diện, lý thuyết, ví dụ, thẻ ghi nhớ và bài kiểm tra chạy trực tiếp trên trình duyệt — không cần build, không cần máy chủ.

## Nội dung

- **18 bài học** chia thành **6 chuyên đề**, tổng thời lượng đọc ước tính 269 phút.
- Mỗi bài gồm mục tiêu, các phần lý thuyết, **ví dụ minh hoạ kèm phân tích**, điểm chốt cần nhớ và nguồn tham chiếu.
- **90 câu hỏi trắc nghiệm** có đáp án và giải thích, lưu điểm cao nhất.
- **72 thẻ ghi nhớ** để ôn nhanh, đánh dấu thẻ đã nhớ.
- Đề tổng hợp ngẫu nhiên 20 câu trộn từ cả 18 bài.

## Tính năng

| Tính năng | Mô tả |
| --- | --- |
| Lộ trình học | Đi tuần tự theo chuyên đề hoặc nhảy tới phần còn yếu. |
| Bài học có ví dụ | Lý thuyết chia tầng, ví dụ và phân tích ngay trong bài. |
| Ôn lại kiến thức | Thẻ ghi nhớ lật mặt, lọc theo chuyên đề, chế độ “Chưa nhớ”. |
| Kiểm tra | Trắc nghiệm theo bài hoặc tổng hợp, giải thích sau mỗi câu. |
| Tiến độ | Lưu cục bộ trên thiết bị: bài đã học, điểm cao nhất, thẻ đã nhớ. |
| Tìm kiếm | Tìm nhanh theo tiêu đề, từ khoá và nội dung, hỗ trợ gõ không dấu. |
| AI luyện tập | Trang giới thiệu và biểu mẫu minh hoạ — tính năng đang phát triển. |

## Cấu trúc dự án

```
.
├── index.html
├── .nojekyll
├── .github/workflows/pages.yml
└── assets
    ├── css/styles.css
    └── js
        ├── data-topics.js      # 6 chuyên đề
        ├── data-lessons-a.js   # bài 1–8
        ├── data-lessons-b.js   # bài 9–14
        ├── data-lessons-c.js   # bài 15–18
        ├── data.js             # ghép dữ liệu thành window.VACT
        └── app.js              # router, giao diện, quiz, thẻ, tìm kiếm
```

Không có bước build, không có phụ thuộc npm. Mọi đường dẫn đều tương đối và điều hướng dùng hash (`#/bai/...`) nên chạy được trên GitHub Pages.

## Chạy thử trên máy

Cách đơn giản nhất là mở trực tiếp `index.html` bằng trình duyệt. Nếu muốn chạy qua HTTP:

```bash
cd site
python3 -m http.server 8000
# mở http://localhost:8000
```

## Đưa lên GitHub Pages

### Cách 1 — Dùng workflow có sẵn (khuyến nghị)

1. Tạo repository mới trên GitHub.
2. Giải nén `v-act-tieng-viet.zip` và đưa **toàn bộ nội dung** (kể cả thư mục `.github`) lên nhánh `main`.
3. Vào **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
4. Workflow `Deploy V-ACT to GitHub Pages` sẽ tự chạy sau mỗi lần push. Địa chỉ web nằm ở tab **Actions** hoặc **Settings → Pages**.

### Cách 2 — Deploy từ nhánh

1. Đưa nội dung site lên nhánh `main`.
2. Vào **Settings → Pages**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`.
3. Tệp `.nojekyll` đã có sẵn để GitHub không xử lý Jekyll và giữ nguyên mọi tệp.

### Nếu đưa site vào thư mục con

Nếu muốn đặt site trong `docs/` hoặc một thư mục con khác, hãy chuyển toàn bộ tệp vào đó và đổi `path` trong workflow thành `./docs` (hoặc tên thư mục tương ứng).

## Ghi chú nội dung

Nội dung lý thuyết được chọn lọc và cấu trúc lại từ 8 tệp PDF đầu vào; phần 7–8 là tài liệu luyện đề nên được dùng làm định hướng biên soạn câu hỏi. Mỗi bài đều ghi rõ nguồn tham chiếu ở cột bên trái. Đây là tài liệu học tập, không phải đề thi chính thức.

Tiến độ học được lưu trong `localStorage` của trình duyệt với các khoá `vact:done`, `vact:quiz`, `vact:known`. Xoá dữ liệu trang sẽ đặt lại toàn bộ tiến độ.
