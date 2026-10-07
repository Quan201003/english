# Từ Từ · Anki

Ứng dụng học từ vựng thuần HTML, CSS và JavaScript. Không cần React, Java, Spring Boot, Node.js hoặc database.

## Chạy trong VS Code

Cài extension **Live Server**, mở `anki-static/index.html`, nhấn chuột phải và chọn **Open with Live Server**.

Hoặc dùng PowerShell:

```powershell
cd F:\Codex\2026-07-17\ha\outputs\tu-tu-flashcard\anki-static
python -m http.server 5500
```

Mở `http://127.0.0.1:5500`.

## Cấu trúc

- `anki-static/index.html`: giao diện.
- `anki-static/styles.css`: kiểu dáng responsive.
- `anki-static/app.js`: toàn bộ logic học và luyện tập.
- `anki-static/vocabulary-data.js`: dữ liệu 180 unit Anki, 3.600 từ.
- `anki-static/audio/<unit-id>/<position>.mp3`: audio phát âm gốc khớp với từng thẻ Anki.

Dấu sao, tiến độ trong phiên học và thiết lập người dùng được lưu trong `localStorage` của trình duyệt. Các phím tắt: `←`/`→` chuyển từ, `↓` lật thẻ, `↑` đánh dấu sao.
