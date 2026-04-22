Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 100ms

# Start the app hiddenly to save GIF size/time
Hide
Type "node dist/cli.js TEST.md"
Enter
# CI is slow, give it a massive buffer
Sleep 45s
# Force redraw to ensure TUI is visible
Ctrl+L
Sleep 5s
Show

# Smooth scroll through the document
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

# Final long wait at the bottom to see everything
Sleep 10s

# Hide the exit
Hide
Type "q"
Sleep 2s
