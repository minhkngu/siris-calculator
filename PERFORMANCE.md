# Kết quả tối ưu tải trang — 27/10/2026

## Kết quả

| Chỉ số | Trước | Sau | Giảm |
| --- | ---: | ---: | ---: |
| JavaScript tải ban đầu, chưa nén | 520,94 KB | 351,60 KB | 32,5% |
| JavaScript tải ban đầu, gzip | 156,77 KB | 108,76 KB | 30,6% |
| CSS tải ban đầu, chưa nén | 57,08 KB | 49,27 KB | 13,7% |
| Trung vị sẵn sàng tính giá, mở mới | 3.030 ms | 1.274 ms | 58,0% |
| Trung vị sẵn sàng tính giá, tải lại | 1.993 ms | 1.481 ms | 25,7% |

Đạt mục tiêu giảm ít nhất 25% JavaScript ban đầu và 20% thời gian sẵn sàng trong đợt đo cục bộ này. Chưa xác nhận các mức giảm thời gian trên website production.

## Cách đo và giới hạn

- Bản trước là snapshot `dist` được build từ thư mục làm việc trước khi thay đổi. Bản sau dùng Vite production build; cả hai được phục vụ cục bộ bằng gzip, tài nguyên có cache và HTML không cache.
- Chrome headless, mạng giả lập 100 ms độ trễ, tải xuống 200.000 byte/giây (1,6 Mbps), tải lên 100.000 byte/giây, CPU chậm 4 lần.
- Mỗi bản có 5 context trình duyệt mới; mỗi context đo một lần mở mới và một lần tải lại. Tải lại giữ cache tài nguyên và phiên. API không cache ở trình duyệt.
- Cả hai bản đọc Lark thật qua cùng backend, tắt cache dữ liệu trong instance: bản trước đọc `all` (5 bảng), bản sau đọc `room` (4 bảng). Không thay đổi bất kỳ bản ghi nào trong Lark.
- Thời gian sẵn sàng được lấy từ lúc điều hướng đến khi trình duyệt xác nhận ô báo giá phòng đã hiển thị. Đây là thời gian quan sát được của bài kiểm tra, không phải điểm Lighthouse hoặc dữ liệu người dùng thực.
- API qua CDN Vercel, cache hit/miss và cold start trên Vercel chưa được đo vì chưa có URL production trong cấu hình dự án. Không triển khai production trong công việc này.
- Lark dao động đáng kể: API trung vị mở mới trước/sau là 1.451/1.000 ms; tải lại là 1.641/1.050 ms. Vì vậy không quy toàn bộ mức cải thiện thời gian cho thay đổi mã, và không cam kết tỷ lệ đó cho mọi lần truy cập.
- Dung lượng trong bảng là bản build cuối. Đợt đo thời gian dùng cùng luồng tải và bundle 351,44 KB; bản cuối thêm khoảng 0,16 KB xử lý lỗi tải hiệu ứng, đã kiểm tra lại bằng bài kiểm tra trình duyệt.
- Số liệu từng lượt nằm trong `performance-results.json`; không chứa giá phòng, nội dung Lark hoặc thông tin xác thực.

## Các thay đổi tạo ra kết quả

- HTML bắt đầu yêu cầu dữ liệu mới theo tab đã lưu trong khi tải bundle; React dùng lại đúng promise đó nên không gọi trùng.
- Tab vật dụng, giao diện nhiều phòng, lịch và tính năng hiệu ứng được tải riêng khi cần. Mã tính tiền và giao diện chính giữ nguyên.
- API tách `scope=room|items|all`, mặc định `all`. Cache cục bộ và yêu cầu đang chạy tách theo scope; dữ liệu thiếu hoặc lỗi không được dùng làm kết quả hợp lệ.
- Cache CDN phản hồi thành công giữ 5 giây, không trả bản cũ khi cập nhật nền. Trình duyệt không lưu giá vào storage; lỗi không cache.
- Giữ tiêu đề và tab trong lúc tải/lỗi; thử lại chỉ đọc nhóm bị lỗi. Lỗi tải mã có nút tải lại trang.
- Khôi phục lựa chọn từng nhóm khi dữ liệu hợp lệ, giữ lựa chọn nhóm chưa tải, và khôi phục vị trí cuộn sau khi giao diện tải xong.

## Kiểm chứng

- `npm run typecheck` và `npm run build`: qua.
- `npm test`: 35 kiểm thử qua, gồm công thức giá, vật dụng, xác thực, cache, scope, tải đồng thời, dữ liệu thiếu và API cục bộ/Vercel.
- `scripts/check-browser.mjs`: qua với dữ liệu giả lập; kiểm tra tải mã khi cần, lịch, VAT, nhiều phòng, số lượng vật dụng, khôi phục ở cả hai tab, lỗi độc lập, thử lại và lỗi tải lịch/hiệu ứng.
- Kiểm tra giao diện desktop và điện thoại 390 px; không có tràn ngang trên trường hợp kiểm tra.

Xem phần “Kiểm tra trình duyệt” trong README để chạy lại. Bài kiểm tra browser dùng Playwright có sẵn ở môi trường kiểm tra, không thêm dependency vào ứng dụng.
