$template = [System.IO.File]::ReadAllText("src\index.template.html", [System.Text.UTF8Encoding]::new($false))
$jsFiles = Get-ChildItem "src\js\*.js" | Sort-Object Name
$combined = ""
foreach ($f in $jsFiles) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.UTF8Encoding]::new($false))
    $combined += "`n" + $content + "`n"
}
$finalHtml = $template.Replace("<!-- INJECT_SCRIPTS -->", $combined)
[System.IO.File]::WriteAllText("index.html", $finalHtml, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText("gas_index.html", $finalHtml, [System.Text.UTF8Encoding]::new($false))
Write-Host "PowerShell Build completed successfully!"
