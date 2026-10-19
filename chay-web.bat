@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG HỆ THỐNG THƯ VIỆN REST API (PORT 8000)
echo ========================================================
echo.
echo Lưu ý: Hãy đảm bảo MySQL trong XAMPP đang chạy!
echo.

set PHP_BIN=php
if exist "C:\xampp\php\php.exe" set PHP_BIN="C:\xampp\php\php.exe"
if exist "D:\xamphp\php\php.exe" set PHP_BIN="D:\xamphp\php\php.exe"

if not exist "config\jwt-secret.php" (
    echo Đang khởi tạo khóa JWT...
    %PHP_BIN% scripts/init-auth.php
)

echo Đang mở trình duyệt và khởi động máy chủ tại http://localhost:8000 ...
start http://localhost:8000/index.html
%PHP_BIN% -S localhost:8000 -t public router.php
pause
