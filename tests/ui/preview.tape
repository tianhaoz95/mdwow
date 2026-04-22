Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"

# Hide the setup and the initial command
Hide
Type "node dist/cli.js TEST.md"
Enter
# Give it a very long time to be safe in CI
Sleep 30s
# Fresh redraw
Ctrl+L
Sleep 2s
Show

# Smooth scroll through the document
# We send 'j' instead of 'Down' to be absolutely sure it's handled as input
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s
Type "jjjjj"
Sleep 1s

# Final long wait at the bottom to see everything
Sleep 10s

# Hide the exit
Hide
Type "q"
Sleep 2s
