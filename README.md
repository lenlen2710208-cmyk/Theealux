# Theealux / Aetheria

Website fan-made dành cho người chơi **Ngôi Sao Thời Trang VNG** tại Việt Nam.

## Trạng thái
- Frontend hiện dùng **một runtime duy nhất: `aetheria-final.js`**; các lớp vá runtime cũ không còn được nạp trong `index.html`.
- Mobile-first: tìm kiếm, kho item, tủ đồ cục bộ, chi tiết item, bảng xếp hạng và công cụ chặng dùng chung một pipeline dữ liệu.
- Catalog hiện tại: **37.589 bản ghi**, được đọc trực tiếp từ `data/items.json`; không hard-code 32.561.
- Tên Việt được lưu riêng trong `data/vietnamese-names.json`; file hiện ghi nhận **5.702 tên đã khớp**. Đây không phải tuyên bố rằng mọi item đều đã được VNG xác nhận riêng.
- 10 thuật ngữ: **Quý phái, Đơn giản, Thanh lịch, Năng động, Trưởng thành, Dễ thương, Gợi cảm, Trong sáng, Giữ ấm, Mát mẻ**.
- Xếp hạng là **tham khảo** từ thuộc tính item + trọng số chặng. Website không gọi đó là điểm trận đấu chính thức của VNG.
- Khu thi đấu lấy thứ tự thuộc tính chủ đề làm trọng số tham khảo, không giả định công thức điểm kín của máy chủ.

## Dữ liệu
- `data/items.json` — catalog item.
- `data/vietnamese-names.json` — tên Việt theo ID.
- `data/stages.json` + `data/stages-extra.json` — chặng và trọng số tham khảo.
- `data/source-policy.json` — phạm vi và nguyên tắc nguồn.
- `data/schema.json` + `data/items.schema.json` — schema; khóa thuộc tính dùng `elegant` cho **Thanh lịch**.

## Kiểm tra
GitHub Pages chạy `scripts/validate-dataset.mjs` trước khi deploy. Validator kiểm tra JSON, ID trùng, tên rỗng, rarity, 10 thuộc tính, image/source fields và count.

## Nguồn tham khảo
- **Ngôi Sao Thời Trang VNG:** nguồn chính thức tại Việt Nam.
- **Annie Nikki Homes:** kho fan-made tiếng Việt; trang chủ hiện hiển thị 32.561 trang phục và công cụ tối ưu chặng.
- **BWIKI / Bilibili Game:** đối chiếu dữ liệu cộng đồng.
- **Miracle Nikki Wiki / Gamerch:** đối chiếu thuộc tính, chặng và cơ chế công khai khi cần.

## Bản quyền
Theealux/Aetheria là dự án fan-made độc lập, không thuộc VNG Corporation. Tên, hình ảnh và tài nguyên game thuộc chủ sở hữu tương ứng.
