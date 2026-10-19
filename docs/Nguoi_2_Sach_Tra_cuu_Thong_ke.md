# Người 2 — Sách, tra cứu, thống kê và nền tảng dùng chung

Dự án: Hệ thống thư viện mượn–trả sách sử dụng REST API

Bản phân công ngày 14/10/2026. Đọc phần công việc riêng trước, sau đó dùng quy ước chung để triển khai và ghép code. Các ô checklist dùng để theo dõi tiến độ thực tế.


## Công việc riêng của Người 2

Bạn phụ trách nền tảng dùng chung, sách, danh mục, tra cứu, dashboard và tổng hợp tài liệu. Bạn viết API PHP, trang HTML, CSS và JavaScript cho các module này. Độ khó chính là thiết kế API nhất quán, xử lý tìm kiếm/phân trang, điều chỉnh số lượng đúng với loans và bảo đảm cài được dự án trên máy khác.

### A. Nền tảng dùng chung và môi trường

1. Kiểm tra PHP, MySQL/MariaDB, Apache, Composer và extension PDO MySQL; ghi phiên bản thực tế đã chạy vào README. Chọn thư viện tương thích môi trường, không ghi phiên bản chưa kiểm thử.
2. Tạo cấu trúc thư mục theo bảng sở hữu file. Cấu hình đường dẫn API ở một chỗ.
3. Thiết kế categories/books; nhận thiết kế users/loans từ Người 1, cùng kiểm tra quan hệ rồi tổng hợp schema.sql.
4. Tạo seed.sql có dữ liệu minh họa; mật khẩu hash do Người 1 cung cấp. Nếu tạo dữ liệu borrowed thì tồn, ngày và trạng thái phải khớp.
5. Viết getConnection bằng PDO, bật xử lý lỗi bằng exception, cấu hình charset.
6. Viết readJsonBody, sendJson và router; phân biệt route không tồn tại với method không hỗ trợ.
7. Cấu hình Apache rewrite cho đường dẫn /api/v1; README nêu rõ vị trí thư mục trong htdocs và cách bật cấu hình cần thiết.
8. Viết apiFetch và common.css. Frontend được mở qua http://localhost/... để chạy cùng origin, không mở file HTML bằng file://.
9. Nhận auth.php của Người 1; kiểm tra Admin/Member trên một route mẫu. Không nộp hàm giả luôn cho phép truy cập.
10. Bàn giao nền tảng sớm để Người 1 bắt đầu module; không chờ giao diện hoàn thiện.

Cấu hình cần có: DB host/port/name/user/password; đường dẫn ứng dụng; thời hạn/issuer/audience/secret JWT; MAX_ACTIVE_LOANS=3 và LOAN_DAYS=14. Cung cấp config mẫu với placeholder và hướng dẫn tạo secret, không lưu secret thật vào Git.

### B. Quản lý danh mục

| Mã | Chức năng | Luật và điều kiện đạt |
|---|---|---|
| DM01 | Danh sách danh mục | Guest được xem; phản hồi JSON thống nhất |
| DM02 | Thêm | Admin; tên 1–100 ký tự sau trim; không trùng |
| DM03 | Sửa | Admin; ID tồn tại; tên hợp lệ và không trùng danh mục khác |
| DM04 | Xóa | Admin; chỉ khi không có sách tham chiếu |

Khi xóa danh mục đang có sách, trả 409 và thông báo rõ. Khóa ngoại vẫn phải bảo vệ DB nếu request đến đồng thời. Cần ánh xạ lỗi trùng tên/khóa ngoại đã biết sang lỗi nghiệp vụ, không đẩy nguyên lỗi SQL ra giao diện.

Màn hình admin/categories.html có danh sách, form thêm/sửa, nút xóa có xác nhận và thông báo lỗi. JavaScript gọi API thật.

### C. Quản lý sách và số lượng

| Mã | Chức năng | Luật và điều kiện đạt |
|---|---|---|
| S01 | Danh sách công khai | Chỉ sách is_active=true; có phân trang |
| S02 | Chi tiết | Sách hoạt động công khai; sách ngừng cho mượn chỉ Admin xem qua quyền phù hợp |
| S03 | Thêm | Admin; kiểm tra thông tin và danh mục; available_copies khởi tạo bằng total_copies |
| S04 | Sửa thông tin | Admin; không thay ID, lịch sử hoặc available_copies từ client |
| S05 | Điều chỉnh tổng số bản | Admin; giữ nguyên số bản đang mượn; transaction và khóa sách |
| S06 | Ngừng/mở lại cho mượn | Admin; thay is_active; lịch sử vẫn hiển thị |
| S07 | Xóa | Admin; chỉ khi chưa từng có loans, kể cả yêu cầu đã hủy/từ chối |

Kiểm tra đầu vào:
- title và author bắt buộc, không chỉ có khoảng trắng, tối đa 200 ký tự.
- category_id là số nguyên dương và tồn tại.
- total_copies là số nguyên không âm. Bản cơ sở không nhận số thập phân.
- publication_year để trống hoặc số nguyên trong khoảng 1000–2100 theo quy tắc demo.
- publisher tối đa 200 ký tự; description tối đa 5000 ký tự.
- is_active là giá trị boolean theo hợp đồng.
- cover_path là đường dẫn tương đối trong bộ ảnh bìa có sẵn của dự án, có ảnh mặc định. Bản cơ sở không cần API upload ảnh; chỉ chấp nhận tên/đường dẫn trong danh sách cho phép.
- Không cho path traversal, đường dẫn hệ thống tùy ý hoặc URL tùy ý từ client vào xử lý file.

Luồng sửa số lượng:
1. Xác thực Admin, nhận total_copies mới.
2. Bắt đầu transaction, khóa hàng books.
3. Tính số đang mượn = tổng cũ - số còn cũ.
4. Nếu tổng mới nhỏ hơn số đang mượn, trả 409 sau rollback.
5. Tính số còn mới = tổng mới - số đang mượn.
6. Cập nhật tổng/số còn/updated_at rồi commit.
7. Không đếm loans ở ngoài transaction rồi cập nhật theo kết quả có thể đã cũ.
8. Kiểm thử với Người 1 khi giao/trả đang xảy ra.

Luồng xóa: kiểm tra lịch sử loans, giữ khóa/ràng buộc DB để xử lý cạnh tranh; nếu có lịch sử trả 409 và gợi ý ngừng cho mượn. Không xóa lịch sử để ép thao tác xóa thành công.

Màn hình admin/books.html gồm bảng sách, tìm kiếm, form thêm/sửa, chọn danh mục, đổi tổng số bản, trạng thái và xóa. Dùng CSS riêng cho module và common.css.

### D. Tra cứu và trang công khai

| Mã | Chức năng | Cách triển khai |
|---|---|---|
| TC01 | Tìm tên sách/tác giả | Gửi q lên API; truy vấn tham số hóa |
| TC02 | Lọc danh mục | category_id hợp lệ |
| TC03 | Lọc còn sách | available=true nghĩa available_copies > 0 |
| TC04 | Sắp xếp | sort trong title/created_at; order asc/desc |
| TC05 | Phân trang | page >=1; limit mặc định 10, tối đa 50; total theo cùng điều kiện lọc |
| TC06 | Xem chi tiết và gửi yêu cầu mượn | Chi tiết từ books API; nút mượn gọi loans API của Người 1 |

- Sắp xếp ổn định, thêm ID làm tiêu chí phụ khi giá trị bằng nhau để giảm trùng/lệch trang.
- q rỗng là không tìm kiếm. Tham số không hợp lệ trả 422; page vượt trang cuối trả mảng rỗng và meta hợp lệ.
- Khi đổi bộ lọc, trở về page=1.
- UI có trạng thái đang tải, danh sách rỗng và lỗi mạng.
- Guest bấm mượn được hướng dẫn đăng nhập; Member gọi POST loans với book_id; Admin dùng khu vực quản trị.
- Sách hết bản vẫn có thể hiển thị trong danh sách công khai khi không bật lọc còn sách; nút mượn bị vô hiệu hóa nhưng server vẫn kiểm tra.
- Sau gửi thành công, hiển thị “Chờ xử lý”; chưa giảm số còn trên giao diện vì chưa giao sách.
- Sách ngừng cho mượn vẫn xuất hiện trong lịch sử loans của chủ sở hữu qua loans API; không bắt buộc public book detail phải mở lại.

Màn hình chính: index.html và book-detail.html. Đầu trang hiển thị trạng thái đăng nhập dựa trên cơ chế chung, không lấy việc hiện/ẩn menu làm căn cứ cấp quyền API.

### E. Thống kê cơ bản

GET /statistics chỉ cho Admin. Lấy dữ liệu thật từ DB, chưa cần biểu đồ phức tạp.

| Chỉ số | Định nghĩa |
|---|---|
| total_titles | Tổng số đầu sách trong books, gồm cả sách ngừng cho mượn; ghi nhãn rõ |
| total_copies | Tổng total_copies của books |
| available_copies | Tổng available_copies; gồm sách ngừng cho mượn nếu ghi là số bản còn trong kho |
| active_members | Số users có role=member và is_active=true |
| pending_loans | Số loans pending |
| borrowed_loans | Số loans borrowed |
| overdue_loans | borrowed và ngày hiện tại > due_date |
| most_borrowed_books | Xếp hạng theo lượt đã giao: borrowed + returned; không đếm pending/cancelled/rejected |

Hiển thị rõ “còn trong kho” khác với “có thể mượn”: nếu cần số có thể mượn, chỉ cộng sách active và ghi tên chỉ số riêng. Tránh JOIN nhiều bảng làm nhân đôi SUM/COUNT; dùng truy vấn tổng hợp phù hợp. Báo cáo chỉ khẳng định thống kê đúng với dữ liệu kiểm thử.

Màn hình admin/dashboard.html có ô số liệu và bảng sách mượn nhiều. Sau giao/trả, khi tải lại hoặc làm mới phải hiển thị số đúng. Không gọi cập nhật sau thao tác là WebSocket/thời gian thực nếu chỉ dùng fetch.

### F. API Người 2 sở hữu

| Method | Route sau /api/v1 | Quyền | Kết quả |
|---|---|---|---|
| GET | /categories | Công khai | 200 danh sách |
| GET | /categories/{id} | Công khai | 200 hoặc 404 |
| POST | /categories | Admin | 201 và Location |
| PUT | /categories/{id} | Admin | 200 |
| DELETE | /categories/{id} | Admin | 204 hoặc 409 |
| GET | /books | Công khai/Admin theo bộ lọc | 200 data và meta |
| GET | /books/{id} | Công khai nếu active; Admin xem cả inactive | 200 hoặc 404 |
| POST | /books | Admin | 201 và Location |
| PUT | /books/{id} | Admin | 200; đầy đủ trường có thể sửa |
| DELETE | /books/{id} | Admin | 204 hoặc 409 |
| GET | /statistics | Admin | 200 số liệu tổng hợp |

GET books: q, category_id, available, sort, order, page, limit. Chỉ Admin được thêm include_inactive=true; Guest/Member gửi tùy chọn này trả 403 thay vì lộ sách ngừng cho mượn.

PUT books gồm title, author, category_id, publisher, publication_year, description, cover_path, total_copies, is_active. Các trường tùy chọn dùng null/chuỗi rỗng theo schema được ghi rõ. Khi thay trạng thái đơn giản, form gửi lại đầy đủ dữ liệu PUT; nếu sau này thêm PATCH books phải cập nhật tài liệu và kiểm thử, không tự thay hợp đồng.

### G. Bộ kiểm thử bắt buộc của Người 2

| Test | Tình huống | Mong đợi |
|---|---|---|
| B01 | Guest lấy danh sách/chi tiết sách hoạt động | 200; không lộ dữ liệu tài khoản |
| B02 | Guest/Member gọi thêm/sửa/xóa | 401/403 đúng trường hợp |
| B03 | Tên danh mục trùng | 409 |
| B04 | Xóa danh mục có sách | 409; dữ liệu giữ nguyên |
| B05 | Thêm sách hợp lệ | 201; số còn bằng tổng |
| B06 | Danh mục không tồn tại, tổng âm hoặc thập phân | 422 |
| B07 | Sửa sách | 200; dữ liệu đọc lại đúng |
| B08 | Giảm tổng thấp hơn số đang mượn | 409 |
| B09 | Tăng tổng khi có sách đang mượn | Số còn tăng đúng delta |
| B10 | Xóa sách chưa có lịch sử | 204; lần GET sau 404 |
| B11 | Xóa sách đã có lịch sử bất kỳ | 409 |
| B12 | Sách inactive trên public và Admin | Public không thấy; Admin xem được |
| B13 | q/category/available kết hợp | Đúng dữ liệu và total |
| B14 | Phân trang, đổi bộ lọc, sort | Không sai meta; trở về trang 1 khi đổi lọc |
| B15 | Truyền tên cột sort tùy ý hoặc chuỗi kiểu SQL | Bị từ chối/không thực thi SQL tùy ý |
| B16 | Tên sách chứa ký tự HTML | Hiển thị dạng văn bản, không chạy script |
| B17 | Số liệu dashboard với seed biết trước | Từng chỉ số khớp tính tay |
| B18 | Nhấn mượn ở trang chi tiết | Gọi đúng loans API; pending không giảm tồn |
| B19 | Sửa tổng đồng thời với giao/trả | Bảo toàn tổng/số còn/số đang mượn |
| B20 | API trả 204, lỗi 401/403/409 và lỗi mạng | JS xử lý riêng, không lỗi parse JSON |
| B21 | Cài trên máy Người 1 bằng README | Chạy được mà không sửa đường dẫn trong nhiều file |
| B22 | cover_path chứa ../ hoặc đường dẫn ngoài bộ ảnh | 422 |

Các test bảo mật chỉ thực hiện trên dự án của nhóm. Khi ghi minh chứng, không chụp secret hay token thật vào báo cáo công khai.

### H. Kiến thức cần học theo thứ tự

1. HTML form, bảng, thẻ trình bày sách; CSS Flexbox/Grid, responsive và trạng thái thông báo.
2. DOM và fetch; event listener; async/await; URLSearchParams để tạo bộ lọc.
3. PHP request/response JSON, HTTP methods và status codes.
4. PDO, JOIN, COUNT/SUM, WHERE, ORDER BY allowlist, LIMIT/OFFSET.
5. Khóa chính/ngoại, index, unique và transaction khi sửa số lượng.
6. Resource khác representation; REST gồm các ràng buộc kiến trúc, không chỉ đặt URL đẹp và trả JSON.
7. PUT, POST, PATCH; tính safe/idempotent. DELETE lặp có thể trả mã khác mà hiệu ứng mong muốn vẫn idempotent.
8. Cache-Control, ETag, request có điều kiện; chỉ học/triển khai mở rộng khi cốt lõi đạt.
9. OpenAPI: paths, parameters, requestBody, responses, schemas, Bearer security.
10. REST/GraphQL/SOAP: so sánh đúng bản chất và cùng nhu cầu dữ liệu; tránh kết luận “công nghệ A luôn nhanh hơn” khi chưa đo.

### I. Tài liệu API, README và báo cáo

- Viết OpenAPI phần categories/books/statistics. Nhận phần auth/users/loans của Người 1, ghép docs/openapi.yaml; kiểm tra schema/status không mâu thuẫn code.
- Tổng hợp Postman theo nhóm Auth, Users, Categories, Books, Loans, Statistics. Mỗi người vẫn chịu trách nhiệm test phần mình.
- README phải có: công cụ/phiên bản đã thử; cấu hình XAMPP/DB; composer install; tạo secret; import schema và seed; URL frontend/API; tài khoản demo; cách nhập Postman; test luồng chính; lỗi thường gặp và giới hạn đã biết.
- Lưu ảnh bìa và các tài nguyên cần chạy trong bài nộp hoặc ghi phụ thuộc rõ. Kiểm thử trước tình huống phòng học không có mạng; không phụ thuộc ngầm vào CDN để ứng dụng hoạt động.
- Viết báo cáo phần lịch sử/ràng buộc REST, HTTP, tài nguyên, so sánh REST/GraphQL/SOAP, kiến trúc tổng thể, ERD, catalogue/tra cứu, dashboard và kết quả test.
- Ghép bản Word/PDF theo mẫu Khoa; Người 1 kiểm tra chéo. Chuẩn bị slide cho phần mình.
- Thuyết trình khoảng 8–9 phút trong video chung 18 phút: giới thiệu REST, kiến trúc, tra cứu/quản trị sách, Postman, số liệu và so sánh.
- Không tự viết thay phần Người 1 khi chưa có nội dung; yêu cầu bàn giao đúng mốc để chia việc công bằng.

### J. Phần mở rộng hướng tới bài sâu hơn

Ưu tiên cache HTTP cho GET sách công khai:
1. Dùng Cache-Control và ETag; nhận If-None-Match, trả 304 khi phù hợp.
2. ETag phản ánh toàn bộ biểu diễn thực sự trả về. Thay đổi tiêu đề, trạng thái, danh mục được nhúng hoặc số còn sau mượn–trả phải làm validator thay đổi khi biểu diễn thay đổi.
3. Phân biệt tham số tìm kiếm/phân trang khi xác định tài nguyên/biểu diễn cache.
4. Không cache chia sẻ token, hồ sơ, loans hay response quản trị; các endpoint riêng tư dùng no-store.
5. Test lần đọc đầu, lần đọc không đổi và lần đọc sau cập nhật.
6. Đo nhiều lần với cùng dữ liệu/môi trường; ghi cả thời gian và dung lượng, không tự đặt số liệu để minh họa kết luận.

Người 1 đồng thời phụ trách links cho loans; cả hai cùng giải thích những ràng buộc đã áp dụng và giới hạn của bản demo. Triển khai cache không tự động làm API đáp ứng toàn bộ REST.

### K. Checklist nhận và bàn giao

Nhận từ Người 1:
- [ ] Schema users/loans, seed tài khoản hash và các trạng thái hợp lệ.
- [ ] requireAuth/requireAdmin cùng hợp đồng lỗi.
- [ ] Request/response POST loans và dữ liệu thử cho dashboard.
- [ ] OpenAPI, Postman, ảnh và nội dung báo cáo phần Người 1.

Bàn giao cho Người 1:
- [ ] DB/router/helper/API_BASE, hướng dẫn cài và cấu hình.
- [ ] API books/categories chạy được với dữ liệu mẫu.
- [ ] Nút gửi yêu cầu trên trang chi tiết gắn API thật.
- [ ] Cập nhật số lượng đúng khi ghép với loans.
- [ ] Dashboard, tài liệu tổng hợp và bản README đã được thử trên máy khác.
- [ ] Phần báo cáo và video của mình đã hoàn thiện.

---


## Quy ước chung của nhóm

Đây là bản hướng dẫn triển khai cho nhóm hai người. Tên Người 1 và Người 2 là nhãn phân công, chưa phải tên thành viên. Mỗi người chịu trách nhiệm trọn phần của mình: PHP API, HTML, CSS, JavaScript, kiểm thử, nội dung báo cáo và thuyết trình. Phạm vi nghiệp vụ và các con số giới hạn dưới đây là đề xuất của nhóm dựa trên nội dung đã phân tích, không phải quy định bắt buộc do giảng viên đưa ra.

### 1. Mục tiêu và phạm vi

- Xây dựng thư viện sách giấy: độc giả gửi yêu cầu trên web; Admin kiêm thủ thư xác nhận giao và nhận lại sách thực tế.
- Stack: HTML, CSS, JavaScript thuần, PHP, MySQL/MariaDB; có thể chạy bằng XAMPP. Composer quản lý thư viện JWT.
- JavaScript gọi API PHP bằng fetch; API trao đổi JSON và kiểm tra quyền ở máy chủ.
- Frontend và Postman sử dụng cùng API.
- Phạm vi cốt lõi: tài khoản/JWT, danh mục, sách, tra cứu, độc giả, yêu cầu mượn, xác nhận giao/trả, lịch sử và thống kê cơ bản.
- Phần mở rộng thực hiện sau khi phần cốt lõi đạt kiểm thử: cache HTTP, hypermedia, đo lường.
- Chưa đưa vào phạm vi cơ sở: tiền phạt, thu tiền, gửi email, quét mã vạch, gia hạn, đặt giữ chỗ, quản lý từng bản sách bằng mã riêng. Những phần này chỉ thêm khi cả nhóm thống nhất đủ thời gian.

### 2. Phân công cân bằng

Điểm khối lượng là ước lượng tương đối để phân công, không phải điểm môn học hoặc số giờ cố định. Sau lần tích hợp đầu tiên, điều chỉnh theo công việc thực tế; mục tiêu 50/50.

| Người | Gói việc | Điểm khối lượng |
|---|---|---:|
| Người 1 | Tài khoản, JWT, kiểm tra quyền | 12 |
| Người 1 | Yêu cầu mượn, giao sách, trả sách, lịch sử và xử lý đồng thời | 22 |
| Người 1 | Quản lý độc giả và giao diện tương ứng | 6 |
| Người 1 | Kiểm thử, tài liệu API phần mình, báo cáo và video | 10 |
| Người 2 | Kết nối DB, router, cấu hình và các tiện ích dùng chung | 8 |
| Người 2 | Danh mục, sách, số lượng và giao diện quản trị | 16 |
| Người 2 | Tra cứu, trang công khai và bố cục chung | 8 |
| Người 2 | Dashboard và thống kê | 6 |
| Người 2 | Kiểm thử, tổng hợp tài liệu API, báo cáo và video | 12 |

Cả hai đều viết đủ HTML/CSS/JS/PHP. Không giao toàn bộ code cho một người và toàn bộ báo cáo cho người còn lại. Người 2 tổng hợp tài liệu; Người 1 vẫn phải nộp tài liệu và kết quả kiểm thử phần mình hoàn chỉnh.

### 3. Vai trò và quyền

| Khả năng | Guest | Member | Admin kiêm thủ thư |
|---|---|---|---|
| Xem sách đang cho mượn, tra cứu, xem danh mục | Có | Có | Có |
| Đăng ký | Có, luôn tạo Member | Không cần | Không cần |
| Xem thông tin cá nhân | Không | Của mình | Của mình |
| Gửi yêu cầu mượn | Không | Có | Không thuộc luồng cơ sở |
| Hủy yêu cầu đang chờ | Không | Chỉ của mình | Dùng thao tác từ chối thay vì hủy hộ |
| Xem lịch sử mượn | Không | Chỉ của mình | Tất cả |
| Giao sách, xác nhận trả, từ chối | Không | Không | Có |
| Quản lý sách, danh mục, độc giả, thống kê | Không | Không | Có |

Ẩn nút trên giao diện chỉ hỗ trợ trải nghiệm. Mọi yêu cầu đều phải được PHP xác thực và kiểm tra quyền. user_id của yêu cầu mượn lấy từ người đã xác thực, không lấy theo giá trị tùy ý do trình duyệt gửi.

### 4. Quy tắc nghiệp vụ đã chọn cho bản cơ sở

1. Một bản ghi loans tương ứng một yêu cầu mượn một bản của một đầu sách.
2. Một độc giả có tối đa 3 lượt đang mượn. Kiểm tra khi gửi yêu cầu và kiểm tra lại lúc giao sách. Yêu cầu đang chờ không giữ chỗ và không làm giảm tồn.
3. Một độc giả không được có đồng thời hai yêu cầu pending/borrowed cho cùng đầu sách.
4. Hạn trả là 14 ngày tính theo ngày xác nhận giao sách. Ngày hạn trả vẫn được xem là đúng hạn.
5. Chỉ Member đang hoạt động được gửi yêu cầu. Chỉ sách đang hoạt động và còn bản mới được yêu cầu.
6. Khi Admin giao sách, kiểm tra lại tài khoản hoạt động, sách hoạt động, số lượng còn và giới hạn mượn.
7. Nếu hết sách trước khi xử lý, không được tạo tồn âm. API trả xung đột, giữ yêu cầu pending để Admin xem xét hoặc từ chối.
8. Độc giả chỉ hủy được yêu cầu pending của mình.
9. Chỉ Admin xác nhận giao và trả sách. Member mang sách đến trả thực tế.
10. Mượn thành công giảm available_copies đúng một; trả thành công tăng đúng một.
11. Từ chối/hủy pending không thay đổi số lượng sách.
12. Lượt đã trả không được trả lần hai. Không xóa lịch sử mượn.
13. Tài khoản bị khóa không được đăng nhập/gọi API cá nhân; Admin vẫn được nhận lại sách của tài khoản đó.
14. Sách từng xuất hiện trong loans không xóa cứng; chuyển is_active=false để ngừng cho mượn mới.
15. Danh mục có sách không xóa. Đổi danh mục cho sách trước nếu muốn xóa danh mục.
16. Giảm tổng số bản không được làm tổng thấp hơn số bản đang mượn.
17. Bản cơ sở chỉ gắn nhãn quá hạn, chưa tự động cấm người quá hạn mượn tiếp và chưa tính tiền phạt.
18. Các giới hạn 3 và 14 đặt trong cấu hình chung, không rải số cố định khắp code.
19. Mọi ngày mượn, hạn trả, ngày trả và người thực hiện đều do server xác định.
20. Thống nhất múi giờ ứng dụng Asia/Ho_Chi_Minh; thời gian DB dùng cùng quy ước +07:00 trong môi trường demo. Không trộn thời gian UTC và giờ địa phương tùy chỗ.

### 5. Trạng thái và chuyển trạng thái

| Trạng thái DB | Nhãn UI | Chuyển tiếp hợp lệ | Người thực hiện |
|---|---|---|---|
| pending | Chờ xử lý | borrowed | Admin khi thực tế giao sách |
| pending | Chờ xử lý | rejected | Admin, có lý do |
| pending | Chờ xử lý | cancelled | Member sở hữu yêu cầu |
| borrowed | Đang mượn | returned | Admin khi thực tế nhận sách |
| returned | Đã trả | Không có trong bản cơ sở | — |
| rejected | Bị từ chối | Không có trong bản cơ sở | — |
| cancelled | Đã hủy | Không có trong bản cơ sở | — |

Quá hạn được tính: status=borrowed và ngày hiện tại lớn hơn due_date. Không lưu overdue thành trạng thái để tránh phải đồng bộ trạng thái mỗi đêm. Lịch sử đã trả có thể hiển thị trả trễ bằng cách so ngày returned_at với due_date.

### 6. Hợp đồng dữ liệu chung

Người 2 tổng hợp database/schema.sql; Người 1 thiết kế và bàn giao phần users/loans. Hai người duyệt sơ đồ quan hệ trước khi viết API. Dùng InnoDB, utf8mb4 và khóa ngoại.

| Bảng | Trường tối thiểu | Ràng buộc chính |
|---|---|---|
| users | id, full_name, email, password_hash, role, is_active, created_at | email duy nhất; role chỉ admin/member; không trả password_hash qua API |
| categories | id, name, description | tên duy nhất theo quy tắc so sánh đã thống nhất |
| books | id, category_id, title, author, publisher, publication_year, description, cover_path, total_copies, available_copies, is_active, created_at, updated_at | category_id tồn tại; 0 <= available_copies <= total_copies |
| loans | id, user_id, book_id, status, requested_at, borrowed_at, due_date, returned_at, approved_by, returned_by, rejection_reason | user/book tồn tại; người xử lý tham chiếu users; ngày chưa phát sinh để NULL |

- users 1–n loans; books 1–n loans; categories 1–n books.
- approved_by và returned_by là Admin thực hiện, không phải độc giả.
- Không cascade delete làm mất lịch sử. Khóa tài khoản thay vì xóa.
- Index nên có: users.email (unique), books.category_id, loans(user_id,status), loans(book_id,status), loans(status,due_date). Chỉ thêm index khác khi có lý do.
- Với dữ liệu hợp lệ: total_copies - available_copies bằng số loans có status=borrowed của đầu sách đó.
- Khi sửa tổng số bản: delta = tổng mới - tổng cũ; số còn mới = số còn cũ + delta. Chỉ chấp nhận khi số còn mới không âm.
- Trình duyệt không được gửi available_copies để ép server cập nhật trực tiếp.
- Dữ liệu mẫu đề xuất: 1 Admin, ít nhất 2 Member, 4 danh mục, khoảng 20 đầu sách; có sách hết bản, sách ngừng cho mượn và lịch sử ở nhiều trạng thái.
- Tài khoản demo ghi trong README; mật khẩu trong DB phải là hash. Khóa bí mật JWT thật nằm ngoài mã nguồn công khai.

### 7. Quy ước API và tiện ích để ghép code

Base URL API có hậu tố /api/v1. Tiền tố thư mục XAMPP do cấu hình chung quyết định; không hardcode đường dẫn máy cá nhân trong từng module. Frontend và API chạy cùng origin trong bản cơ sở.

| Hạng mục | Quy ước |
|---|---|
| Tên trường, đường dẫn, trạng thái | Tiếng Anh theo bảng dữ liệu; comment và tài liệu học có thể tiếng Việt |
| JSON thành công | {"success":true,"data":...,"message":"..."} |
| JSON thất bại | {"success":false,"error":{"code":"...","message":"...","fields":{}}} |
| Danh sách phân trang | data là mảng; thêm meta gồm page, limit, total, total_pages |
| DELETE thành công | 204 và không có body; JS không gọi response.json() khi 204 |
| JSON gửi lên | Content-Type: application/json |
| Xác thực | Authorization: Bearer JWT_TOKEN |
| Người dùng hiện tại | Lấy từ token đã xác minh và kiểm tra users hiện tại |
| Quyền không đủ | 403; lượt mượn thuộc người khác trả 404 để không lộ sự tồn tại |
| Lỗi xác thực | 401; kèm WWW-Authenticate phù hợp |
| Các lỗi khác | 400 JSON hỏng; 404 không tồn tại; 405 phương thức không hỗ trợ kèm Allow; 409 xung đột; 415 sai kiểu nội dung; 422 dữ liệu hợp lệ về JSON nhưng sai giá trị; 500 lỗi nội bộ không lộ SQL |
| Tạo tài nguyên | 201 và Location đến tài nguyên mới |
| PUT | Gửi đầy đủ các trường có thể sửa theo hợp đồng; không dùng để thay ID/lịch sử |
| PATCH loans | Chỉ chuyển trạng thái đã định nghĩa, không cho sửa tự do user_id/book_id/ngày |

Hợp đồng các hàm dùng chung phải được hai người thống nhất ở mốc đầu:
- Người 2: getConnection() trả PDO; sendJson(statusCode, payload); readJsonBody(); router; apiFetch(path, options) và API_BASE ở JS.
- Người 1: requireAuth() trả thông tin người dùng hiện tại hoặc dừng bằng lỗi; requireAdmin() chỉ cho Admin.
- apiFetch phải kiểm tra response.ok, xử lý 204, lỗi mạng và 401. Với 403/404/409/422, giữ thông báo đúng thay vì coi mọi lỗi là hết phiên.
- Token phải được kiểm tra ở PHP; dữ liệu decode chưa xác minh không được dùng để quyết định quyền.
- Các response riêng tư, đăng nhập và dữ liệu mượn đặt Cache-Control: no-store.
- PDO prepared statements cho dữ liệu nhập. Các tên cột sắp xếp dùng allowlist, không nối tùy ý từ người dùng.
- Dùng textContent để hiển thị chuỗi người dùng nhập. Không đưa chuỗi chưa xử lý vào innerHTML.
- PHP tách phần API trả JSON khỏi trang HTML; tránh warning hoặc HTML lẫn vào JSON.

### 8. Thư mục và quyền sửa file

Đây là cây dự kiến để triển khai; hai file hướng dẫn không kèm mã nguồn ứng dụng.

| Nhóm file | Chủ trì | Ghi chú |
|---|---|---|
| config/, database/schema.sql, database/seed.sql, router và .htaccess | Người 2 | Schema users/loans do Người 1 gửi để ghép |
| api/common/db.php, response.php, request.php | Người 2 | Thay chữ ký hàm phải báo Người 1 |
| api/common/auth.php; api/modules/auth/, users/, loans/ | Người 1 | Auth dùng chung cho cả dự án |
| api/modules/categories/, books/, statistics/ | Người 2 | Dùng auth của Người 1 cho thao tác quản trị |
| public/login.html, register.html, profile.html, my-loans.html | Người 1 | Có JS và CSS tương ứng |
| public/admin/users.html, loans.html | Người 1 | Có JS và CSS tương ứng |
| public/index.html, book-detail.html | Người 2 | Trang công khai |
| public/admin/books.html, categories.html, dashboard.html | Người 2 | Trang quản trị |
| public/assets/js/api.js, public/assets/css/common.css | Người 2 | Tiện ích gọi API và bố cục chung |
| docs/openapi-auth-loans.yaml, tests/postman/member1-* | Người 1 | Tài liệu/kiểm thử phần mình |
| docs/openapi-catalog.yaml, tests/postman/member2-* | Người 2 | Tài liệu/kiểm thử phần mình |
| docs/openapi.yaml, README.md | Người 2 tổng hợp | Người 1 gửi đủ nội dung auth/mượn–trả |
| report/, slides/, video/ | Cả hai | Mỗi người viết và trình bày phần mình |

Không sửa file của người kia âm thầm. Nếu cần thay đổi hợp đồng chung, ghi rõ thay đổi và cập nhật cả hai phần.

### 9. Cách phối hợp theo mốc

1. Mốc 0: cả hai duyệt schema, trạng thái, giới hạn 3/14, hợp đồng JSON, chữ ký hàm và route.
2. Mốc 1: Người 2 bàn giao kết nối DB/router/JSON helper/apiFetch; Người 1 bàn giao đăng nhập và requireAuth/requireAdmin. Mỗi người có thể dùng dữ liệu giả trong lúc chờ, nhưng không nộp bản mock làm sản phẩm cuối.
3. Mốc 2: Người 2 hoàn thành danh mục/sách; Người 1 hoàn thành tài khoản/độc giả. Thử đăng nhập Admin để sửa sách và Member để bị từ chối.
4. Mốc 3: Người 1 hoàn thành yêu cầu mượn/giao/trả; Người 2 gắn nút mượn ở chi tiết sách và dashboard đọc dữ liệu thật.
5. Mốc 4: hai người kiểm thử xuyên suốt, kiểm thử đồng thời và các lỗi quyền.
6. Mốc 5: hoàn thiện Postman/OpenAPI/README; chạy trên máy người còn lại bằng hướng dẫn.
7. Mốc 6: viết hoàn chỉnh báo cáo, tập thuyết trình, quay video và kiểm tra bài nộp.
8. Mở rộng chỉ bắt đầu sau mốc 4 đạt. Đây là thứ tự phụ thuộc, không giả định nhóm còn đủ 8 tuần kể từ hôm nay.

Git: mỗi người có nhánh làm việc riêng; commit theo chức năng; tích hợp phần nhỏ thường xuyên. Người 2 có thể ghép bản phát hành đầu, Người 1 ghép bản tiếp theo để chia trách nhiệm. Trước khi tích hợp, người còn lại đọc thay đổi và chạy các test liên quan. Không commit mật khẩu thật, khóa JWT hay token.

### 10. Định nghĩa hoàn thành

Một chức năng chỉ hoàn thành khi:
- Có API xử lý đúng dữ liệu và quyền, không chỉ có màn hình.
- Có giao diện HTML/CSS và JS gọi API thật.
- Có tình huống thành công, dữ liệu sai, chưa đăng nhập và sai quyền nếu áp dụng.
- Có bảng test ghi đầu vào, kết quả mong đợi, kết quả thực tế và đạt/không đạt.
- Có tài liệu request/response và ảnh minh chứng phù hợp.
- Không còn lỗi console/PHP phá vỡ luồng đang kiểm tra.
- Người phụ trách giải thích được request đi qua những file nào và thay đổi dữ liệu gì.

### 11. Đối chiếu đề và bài nộp

Nguồn đề: 503073-Midterm_Vietnamese.docx đã được đọc trong cuộc trao đổi, các mục I–V. Các gợi ý REST gồm quản lý dữ liệu bằng API, JWT, frontend hoặc Postman; nhóm chọn trình diễn cả frontend và Postman.

| Yêu cầu/tiêu chí | Trách nhiệm |
|---|---|
| Lý thuyết 2 điểm | Người 2 chủ trì lịch sử, ràng buộc REST, HTTP, biểu diễn tài nguyên; Người 1 chủ trì stateless, JWT, OAuth và phân quyền; cùng phản biện |
| So sánh 1 điểm | Người 2 chủ trì REST/GraphQL/SOAP trên cùng bài toán; Người 1 bổ sung xác thực, ủy quyền, giới hạn bảo mật và nhận xét |
| Áp dụng và triển khai 1 điểm | Mỗi người mô tả kiến trúc và phần code của mình, cùng ghép luồng tổng thể |
| Cấu trúc báo cáo 2 điểm | Người 2 ghép định dạng; Người 1 kiểm tra thông tin, trích dẫn, hình và tính nhất quán; cả hai duyệt |
| Phạm vi demo 2 điểm | Hai người chịu trách nhiệm các module và luồng tích hợp |
| Minh họa 1 điểm | Mỗi người chụp bằng chứng phần mình và giải thích request/response |
| Video/thuyết trình 1 điểm | Mỗi người trình bày khoảng nửa thời lượng, có lý thuyết lẫn demo |

- Báo cáo tiếng Anh, Word và PDF, 20–60 trang không tính bìa/phụ lục, theo mẫu Khoa.
- Cần đối chiếu Report templates and guidelines.zip trước khi chốt font, lề, trang đầu và phụ lục; tệp mẫu chưa được cung cấp trong cuộc trao đổi.
- Báo cáo có mở đầu, nghiên cứu, so sánh, yêu cầu, thiết kế, triển khai/đánh giá, kết luận, tài liệu tham khảo và phụ lục phù hợp. Giải thích hệ thống, không chép dài toàn bộ code.
- Mã nguồn đầy đủ; composer.json và composer.lock; SQL; cấu hình mẫu; README có môi trường đã kiểm thử, lệnh cài/chạy, tài khoản demo và hướng dẫn kiểm thử.
- Video tiếng Anh tối đa 20 phút, có âm thanh và cả hai thành viên. Đề quy định demo 0 điểm nếu thiếu video có âm thanh hoặc thiếu mã nguồn hoàn chỉnh có hướng dẫn thiết lập.
- Chuẩn bị slide để cả hai trình bày trên lớp tuần 9–10 theo lịch môn học.
- Đề giao thời gian 8 tuần; hạn cụ thể theo lớp. Nộp trễ trừ 1 điểm/ngày, trễ một giây cũng tính một ngày.
- Nhóm hai người đáp ứng quy mô 2–3. Phân công không đều, thiếu thành viên trong video, sai ngôn ngữ, video kém hoặc thiếu thông tin có thể bị trừ điểm theo đề.
- Hoàn thành danh sách không bảo đảm điểm tuyệt đối. Các phần mở rộng phải có bằng chứng và giải thích đúng.

### 12. Nguồn kiến thức chính thức

Đọc các phần liên quan khi thực hiện; đưa nguồn thực sự sử dụng vào tài liệu tham khảo:
- REST và các ràng buộc: https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm
- HTTP methods/status: https://www.rfc-editor.org/rfc/rfc9110.html
- JWT: https://www.rfc-editor.org/rfc/rfc7519.html
- Thư viện PHP JWT: https://github.com/firebase/php-jwt
- OAuth 2.0 (khái niệm ủy quyền): https://www.rfc-editor.org/rfc/rfc6749.html
- PDO prepared statements: https://www.php.net/manual/en/pdo.prepared-statements.php
- Mật khẩu PHP: https://www.php.net/manual/en/function.password-hash.php
- JavaScript fetch: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- OpenAPI: https://learn.openapis.org/introduction.html
- GraphQL: https://spec.graphql.org/
- SOAP: https://www.w3.org/TR/soap12-part1/
- HTTP cache: https://www.rfc-editor.org/rfc/rfc9111.html

