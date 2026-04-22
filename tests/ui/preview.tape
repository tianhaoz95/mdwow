Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"

# Hide the command typing
Hide
Type "node dist/cli.js TEST.md"
Enter
# Give it a lot of time in slow CI
Sleep 30s
# Force a redraw
Ctrl+L
Sleep 2s
Show

# Capture the first page
Screenshot tests/ui/screenshots/preview-main.png

# Scroll down a bit to show more content (Mermaid, etc.)
Type "jjjjjjjjjjjjjjjjjjjj"
Sleep 5s
Screenshot tests/ui/screenshots/preview-scrolled.png

# Quit
Type "q"
