Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 100ms

# Start the app hiddenly
Hide
Type "node dist/cli.js TEST.md"
Enter
Sleep 25s
Ctrl+L
Sleep 2s
Show

# Smooth-ish scroll by repeating commands (Repeat is not a core VHS command)
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
Sleep 5s

# Quit
Hide
Type "q"
Sleep 2s
