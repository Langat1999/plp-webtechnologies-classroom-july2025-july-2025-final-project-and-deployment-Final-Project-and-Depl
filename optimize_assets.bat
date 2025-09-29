@echo off
setlocal enabledelayedexpansion

:: -------------------------------
:: Asset Optimization Script (Images + CSS + JS)
:: -------------------------------
echo [%date% %time%] Starting asset optimization...

:: -------------------------------
:: Check Required Tools
:: -------------------------------
where magick >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: ImageMagick (magick) not found in PATH.
    pause
    exit /b 1
)

:: -------------------------------
:: Image Conversion & Resizing
:: -------------------------------
:: Format: filename width height
:: Add more images as needed
set "images=fallback.jpg 912 912 earth.png 55 55 whatsapp.png 33 33"

for %%A in (%images%) do (
    set "filename=%%A"
    set /a counter+=1
    if !counter! lss 4 (
        set "width=%%B"
        set "height=%%C"
    ) else (
        set "width=%%D"
        set "height=%%E"
    )

    :: Determine output path and name
    set "ext=!filename:~-3!"
    set "name=!filename:~0,-4!"
    set "fullpath=assets\images\!name!_optimized.webp"

    if exist "assets\images\!filename!" (
        if not exist "!fullpath!" (
            echo Converting & resizing !filename! → !name!_optimized.webp
            magick "assets\images\!filename!" -resize !width!x!height!^> -strip -quality 85 "!fullpath!"
        ) else (
            echo !name!_optimized.webp already exists, skipping.
        )
    ) else (
        echo File !filename! not found, skipping.
    )
)

:: -------------------------------
:: CSS Minification
:: -------------------------------
if exist assets\css (
    echo [%date% %time%] Minifying CSS files...
    for %%f in (assets\css\*.css) do (
        set "minfile=%%~nf.min.css"
        set "fullpath=%%~dpf!minfile!"
        if not exist "!fullpath!" (
            echo Minifying %%f → !minfile!
            powershell -Command ^
            "$f=$args[0]; $o=$args[1]; ^
            (Get-Content $f | ForEach-Object { $_.Trim() }) -join '' | ^
            ForEach-Object { $_ -replace '/\*.*?\*/','' -replace '\s+',' ' -replace '\s*{\s*','{' -replace '\s*}\s*','}' -replace '\s*;\s*',';' } | ^
            Set-Content $o" -args "%%f" "!fullpath!"
        ) else (
            echo !minfile! already exists, skipping.
        )
    )
) else (
    echo CSS directory not found, skipping CSS minification.
)

:: -------------------------------
:: JS Minification
:: -------------------------------
if exist assets\js (
    echo [%date% %time%] Minifying JS files...
    for %%f in (assets\js\*.js) do (
        set "minfile=%%~nf.min.js"
        set "fullpath=%%~dpf!minfile!"
        if not exist "!fullpath!" (
            echo Minifying %%f → !minfile!
            powershell -Command ^
            "$f=$args[0]; $o=$args[1]; ^
            (Get-Content $f | ForEach-Object { $_.Trim() }) -join '' | ^
            ForEach-Object { $_ -replace '/\*.*?\*/','' -replace '//.*','' -replace '\s+',' ' -replace '\s*{\s*','{' -replace '\s*}\s*','}' -replace '\s*;\s*',';' } | ^
            Set-Content $o" -args "%%f" "!fullpath!"
        ) else (
            echo !minfile! already exists, skipping.
        )
    )
) else (
    echo JS directory not found, skipping JS minification.
)

:: -------------------------------
:: Done
:: -------------------------------
echo [%date% %time%] Asset optimization complete!
endlocal
pause
