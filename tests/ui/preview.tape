Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"

# Run the app with TEST.md
Type "node dist/cli.js TEST.md"
Enter
Sleep 3s

# Capture the first page
Screenshot tests/ui/screenshots/preview-main.png

# Scroll down a bit to show more content (Mermaid, etc.)
Type "jjjjjjjjjjjjjjjjjjjj"
Sleep 1s
Screenshot tests/ui/screenshots/preview-scrolled.png

# Quit
Type "q"
