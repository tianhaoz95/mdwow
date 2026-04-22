Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 100ms

# Start the app
Hide
Type "node dist/cli.js TEST.md"
Enter
# Extra kick just in case
Sleep 1s
Enter
# Massive wait for CI
Sleep 120s
# Force redraw
Ctrl+L
Sleep 5s
Show

# Smooth-ish scroll
Down 5
Sleep 1s
Down 5
Sleep 1s
Down 5
Sleep 1s
Down 5
Sleep 1s
Down 5
Sleep 1s
Down 5
Sleep 1s
Down 5
Sleep 1s
Down 5
Sleep 1s

# Wait at the bottom
Sleep 10s

# Hide the exit
Hide
Type "q"
Sleep 2s
