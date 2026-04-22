Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"

# Initial wait for shell
Sleep 2s

# Type and enter with extra care
Type "node dist/cli.js TEST.md"
Sleep 1s
Enter
Sleep 1s
# Sometimes CI needs a second kick or just more time
Enter

# Give it a long time to render
Sleep 30s

# Capture the first page
Screenshot tests/ui/screenshots/preview-main.png

# Scroll down
Down 20
Sleep 5s
Screenshot tests/ui/screenshots/preview-scrolled.png

# Quit
Type "q"
Sleep 2s
