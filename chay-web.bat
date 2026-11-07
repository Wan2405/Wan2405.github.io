@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   KHỞI ĐỘNG HỆ THỐNG THƯ VIỆN REST API (PORT 8000)
echo ========================================================
echo.

:: 1. Kiem tra va khoi dong MySQL
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL dang chay san.
) else (
    echo [..] Dang khoi dong MySQL ngam khong can XAMPP Control Panel...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
        echo [OK] Da bat MySQL thanh cong!
    ) else if exist "D:\xamphp\mysql\bin\mysqld.exe" (
        start "" /B "D:\xamphp\mysql\bin\mysqld.exe" --defaults-file="D:\xamphp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
        echo [OK] Da bat MySQL thanh cong!
    ) else (
        echo [CANH BAO] Khong tim thay mysqld.exe, hay tu bat MySQL qua XAMPP!
    )
)
echo.

:: 2. Tim trinh thong dich PHP
set "PHP_BIN=php"
if exist "C:\xampp\php\php.exe" (
    set "PHP_BIN=C:\xampp\php\php.exe"
) else if exist "D:\xamphp\php\php.exe" (
    set "PHP_BIN=D:\xamphp\php\php.exe"
)

:: 3. Kiem tra JWT secret
if not exist "config\jwt-secret.php" (
    echo [..] Dang khoi tao khoa JWT...
    "%PHP_BIN%" scripts/init-auth.php
)

:: 4. Mo trinh duyet va khoi chay server PHP
echo [OK] Dang mo trinh duyet tai http://localhost:8000 ...
start http://localhost:8000/index.html

echo [OK] May chu dang lang nghe tai http://localhost:8000 (Nhan Ctrl+C de dung)
echo.
"%PHP_BIN%" -S localhost:8000 -t public router.php
pause
