Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 100ms

# Start the app
Type "node dist/cli.js TEST.md"
Enter

# Wait for the header to appear (max 60s)
Wait@60s "mdwow"

# Give it a bit more to be sure AST is parsed and rendered
Sleep 5s

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
Sleep 5s

# Quit
Type "q"
Sleep 2s
