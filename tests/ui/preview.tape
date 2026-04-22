Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 100ms

# Initial wait for shell ready
Sleep 5s

# Type and launch
Type "node dist/cli.js TEST.md"
Enter
Sleep 2s
# Extra Enter in case of CI lag
Enter

# Wait for TUI to initialize (it's slow in CI)
Sleep 30s

# Force a redraw
Ctrl+L
Sleep 5s

# Smooth scroll
Down 5
Sleep 2s
Down 5
Sleep 2s
Down 5
Sleep 2s
Down 5
Sleep 2s
Down 5
Sleep 2s

# Linger at the end
Sleep 10s

# Exit
Type "q"
Sleep 2s
