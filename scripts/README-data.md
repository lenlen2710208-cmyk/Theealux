# Nạp dữ liệu thật

Theealux không chứa item giả. Workflow `Theealux initial data load` dùng Playwright để đọc dữ liệu công khai từ Annie Nikki Homes rồi ghi vào `data/items.json`.

Sau khi tải xong, `validate-dataset.mjs` kiểm tra ID/tên và báo nếu dataset còn dưới mục tiêu 32.561 item.

Nếu nguồn không cung cấp payload item, workflow sẽ dừng thay vì tự tạo dữ liệu.
