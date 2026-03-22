# B1_LearningWebsite

Ứng dụng Node.js đơn giản để làm trắc nghiệm từ 3 file:

- `HUTECH_trac_nghiem_1_100.csv`
- `HUTECH_reading_TEXT_1_6_11_23_updated.csv`
- `HUTECH_trac_nghiem_Signs_1_40_filled.csv`

## Chạy local

```bash
npm install
npm start
```

Sau đó mở `http://localhost:3000` trong trình duyệt.

Trang chủ sẽ cho bạn chọn 1 trong 3 page làm bài:

- `/english-100.html`
- `/reading-mixed.html`
- `/signs-40.html`

## Kiểm tra

```bash
npm test
```

## Tính năng

- Tách thành 3 page riêng cho bộ 100 câu, reading, và bộ Signs 1-40
- Bộ 100 câu hỗ trợ ôn hết hoặc ngẫu nhiên 10 câu
- Bộ reading hỗ trợ ôn hết 20 câu hoặc random 1 bộ reading gồm 5 câu
- Bộ Signs 1-40 hỗ trợ ôn hết hoặc ngẫu nhiên 5 câu
- Giữ nguyên vị trí đáp án A, B, C, D như trong file CSV
- Hiển thị bài trắc nghiệm trên một trang web đơn giản
- Chấm điểm trên server
- Xem kết quả và đáp án đúng sau khi nộp bài
