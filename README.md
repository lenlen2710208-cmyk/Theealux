# Theealux / Aetheria

Website fan-made dành cho người chơi **Ngôi Sao Thời Trang VNG** tại Việt Nam. Thương hiệu hiển thị trên website: **Aetheria**.

## Trạng thái hiện tại
- Build giao diện: **r97**.
- Kho dữ liệu repository hiện có **37.589 bản ghi item**; không còn hard-code con số mục tiêu cũ.
- Mobile-first, giao diện warm/editorial, dark mode, tủ đồ cá nhân và tìm kiếm nhanh.
- Bảng xếp hạng: **Quyển 1, Quyển 2, Ải hội, Khu thi đấu**; hỗ trợ Top 20/50/100 và lọc theo loại đồ.
- Xếp hạng tham khảo tự ưu tiên chỉ số số học nếu có; khi chỉ số số chưa được điền, hệ thống dùng **hạng thuộc tính SS → E đã đối chiếu** để sắp xếp theo trọng số của chặng. Đây là chỉ số tham khảo, không phải điểm trận đấu VNG.
- Chi tiết item hiển thị 10 thuộc tính theo thuật ngữ Việt: **Quý phái, Đơn giản, Thanh lịch, Năng động, Trưởng thành, Dễ thương, Gợi cảm, Trong sáng, Giữ ấm, Mát mẻ**.
- Dữ liệu hạng thuộc tính được quét tự động từ các trang item công khai của Annie Nikki Homes và lưu riêng tại `data/item-attribute-grades.json`, không sửa thành số giả trong `items.json`.
- GitHub Actions tự quét phần thuộc tính còn thiếu và chạy định kỳ hàng tuần.
- Tên Việt được đồng bộ riêng theo ID để tránh phải viết lại file item lớn.
- Hình ảnh ưu tiên URL nguồn công khai; Aetheria không tự nhận quyền sở hữu tài nguyên game.

## Kiến trúc dữ liệu

- `data/items.json` — catalog item chính.
- `data/vietnamese-names.json` — tên Việt đối chiếu theo ID.
- `data/item-attribute-grades.json` — hạng 10 thuộc tính được quét từ nguồn item công khai.
- `data/stages.json` + `data/stages-extra.json` — chặng, chủ đề và trọng số.
- `data/stage-structure.json` — cấu trúc **Quyển → Chương → Ải** và **Khu thi đấu → Chủ đề**.
- `data/game-catalog.json` — từ điển các trường dữ liệu mà Aetheria theo dõi.
- `scripts/enrich-item-attributes.mjs` — bộ quét thuộc tính toàn kho.
- `.github/workflows/enrich-item-attributes.yml` — tự động chạy bộ quét và commit dữ liệu mới.

## Nguyên tắc dữ liệu

Aetheria ưu tiên dữ liệu có thể truy nguyên. Nếu nguồn không cung cấp một trường, website để trống hoặc ghi rõ chưa đối chiếu thay vì tự bịa. Đặc biệt, hạng chữ SS/S/A/B/C/D/E chỉ được dùng để **xếp thứ tự tham khảo**; không quy đổi thành “điểm game chính thức”.

## Nguồn tham khảo

- Ngôi Sao Thời Trang VNG: https://ngoisao.vnggames.com/
- Annie Nikki Homes: https://annie-nikki.homes/items
- BWIKI / Bilibili Game: https://wiki.biligame.com/qjnn/
- Miracle Nikki Wiki: https://miracle-nikki.fandom.com/wiki/Miracle_Nikki_Wiki
- Gamerch: https://gamerch.com/miracle-nikki/589252

## Bản quyền

Thealux/Aetheria là dự án fan-made độc lập. Tên, hình ảnh và tài nguyên game thuộc chủ sở hữu tương ứng. Website không phải sản phẩm chính thức của VNG Corporation.
