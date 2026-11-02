# Kiểm thử 12 trường hợp tiêu biểu

Chỉ nhập promotions-representative.csv vào Supabase. File expected dùng đối chiếu, không nhập vào database.

CSV gồm 14 chương trình cho 12 trường hợp: hai trường hợp cuối cần hai chương trình cạnh tranh. Dùng phòng giá 440.000đ CN–T5 và 480.000đ T6–T7; mỗi kỳ hai đêm thứ Năm và thứ Sáu, tổng 920.000đ. Các chương trình không giới hạn chi nhánh/loại phòng.

Tắt VAT, Google Reviews, phụ thu giờ và điều chỉnh thủ công. Chọn ngày nhận/trả trong bảng expected. Tắt các chương trình thử cũ nếu trùng ngày. Mỗi nhóm trong file này dùng tuần riêng nên có thể nhập cùng lúc. Ngày trả không được tính thành đêm lưu trú.

12 trường hợp gồm: phần trăm mỗi đêm; tiền mỗi đêm; tiền cả kỳ; phần trăm cả kỳ; trần mỗi đêm; hai mức trần kết hợp; chỉ một đêm phù hợp; chỉ ngày trả phù hợp; thiếu số đêm; chương trình tắt; chọn giảm nhiều nhất bất kể priority; bằng tiền giảm thì chọn priority cao.

Tắt hoặc xóa các chương trình TEST MẪU sau khi kiểm tra.
