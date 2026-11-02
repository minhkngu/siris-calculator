-- Dữ liệu kiểm thử khuyến mãi. Mỗi lần chạy sẽ thêm 14 dòng.
INSERT INTO public.promotions ("name", "description", "minnights", "stay_start", "stay_end", "discountamount", "ispercentage", "discount_basis", "max_discount_per_night", "max_discount_per_stay", "priority", "is_active") VALUES
  ('TEST MẪU 01 - Giảm 10% mỗi đêm', 'Dữ liệu kiểm thử', '1', '2026-10-08', '2026-10-09', '10', 'true', 'per_night', NULL, NULL, '0', 'true'),
  ('TEST MẪU 02 - Giảm 50.000đ mỗi đêm', 'Dữ liệu kiểm thử', '1', '2026-10-15', '2026-10-16', '50000', 'false', 'per_night', NULL, NULL, '0', 'true'),
  ('TEST MẪU 03 - Giảm 100.000đ cả kỳ', 'Dữ liệu kiểm thử', '1', '2026-10-22', '2026-10-23', '100000', 'false', 'per_stay', NULL, NULL, '0', 'true'),
  ('TEST MẪU 04 - Giảm 10% cả kỳ', 'Dữ liệu kiểm thử', '1', '2026-10-29', '2026-10-30', '10', 'true', 'per_stay', NULL, NULL, '0', 'true'),
  ('TEST MẪU 05 - Trần 50.000đ mỗi đêm', 'Dữ liệu kiểm thử', '1', '2026-11-05', '2026-11-06', '20', 'true', 'per_night', '50000', NULL, '0', 'true'),
  ('TEST MẪU 06 - Cả hai trần', 'Dữ liệu kiểm thử', '1', '2026-11-12', '2026-11-13', '20', 'true', 'per_night', '50000', '70000', '0', 'true'),
  ('TEST MẪU 07 - Chỉ đêm cuối được giảm', 'Dữ liệu kiểm thử', '1', '2026-11-20', '2026-11-20', '10', 'true', 'per_night', NULL, NULL, '0', 'true'),
  ('TEST MẪU 08 - Chỉ ngày trả nằm trong ưu đãi', 'Dữ liệu kiểm thử', '1', '2026-11-28', '2026-11-28', '10', 'true', 'per_night', NULL, NULL, '0', 'true'),
  ('TEST MẪU 09 - Không đủ 3 đêm', 'Dữ liệu kiểm thử', '3', '2026-12-03', '2026-12-04', '10', 'true', 'per_night', NULL, NULL, '0', 'true'),
  ('TEST MẪU 10 - Chương trình đã tắt', 'Dữ liệu kiểm thử', '1', '2026-12-10', '2026-12-11', '10', 'true', 'per_night', NULL, NULL, '0', 'false'),
  ('TEST MẪU 11 A', 'Dữ liệu kiểm thử', '1', '2026-12-17', '2026-12-18', '10', 'true', 'per_night', NULL, NULL, '100', 'true'),
  ('TEST MẪU 11 B', 'Dữ liệu kiểm thử', '1', '2026-12-17', '2026-12-18', '20', 'true', 'per_night', NULL, NULL, '1', 'true'),
  ('TEST MẪU 12 A', 'Dữ liệu kiểm thử', '1', '2026-12-24', '2026-12-25', '10', 'true', 'per_night', NULL, NULL, '0', 'true'),
  ('TEST MẪU 12 B', 'Dữ liệu kiểm thử', '1', '2026-12-24', '2026-12-25', '10', 'true', 'per_night', NULL, NULL, '1', 'true');
