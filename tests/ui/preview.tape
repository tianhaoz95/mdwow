Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 100ms

# Hide the setup and long startup
Hide
Type "node dist/cli.js TEST.md"
Enter
Sleep 20s
Ctrl+L
Sleep 2s
Show

# Smooth scroll down
Repeat 40 {
  Down 1
  Sleep 100ms
}

# Wait at the bottom for a bit
Sleep 5s

# Hide the exit
Hide
Type "q"
Sleep 2s
