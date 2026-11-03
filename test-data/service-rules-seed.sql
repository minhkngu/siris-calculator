-- Thêm các mức phí đang có trong ứng dụng, giữ nguyên dòng early_0900.
-- Lặp lại an toàn: không ghi đè cấu hình đã được quản lý trong Supabase.
INSERT INTO public.service_rules (code, name, description, category, amount_type, amount, calculation_base, excluded_weekdays, sort_order)
VALUES
  ('early_1230', 'Check-in sớm từ 12:30', 'Nhận phòng từ 12:30', 'early_checkin', 'fixed', 150000, NULL, '{}', 10),
  ('early_1300', 'Check-in sớm từ 13:00', 'Nhận phòng từ 13:00', 'early_checkin', 'fixed', 100000, NULL, '{}', 20),
  ('late_1300', 'Check-out trễ trước 13:00', 'Trả phòng trước 13:00', 'late_checkout', 'fixed', 100000, NULL, '{}', 30),
  ('late_1800', 'Check-out trễ trước 18:00', '80% giá đêm sau', 'late_checkout', 'percentage', 80, 'next_night', '{5,6}', 40)
ON CONFLICT (code) DO NOTHING;
