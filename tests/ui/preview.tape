Output tests/ui/screenshots/preview.gif

Set FontSize 16
Set Width 1200
Set Height 1000
Set Padding 20
Set Theme "Catppuccin Mocha"

# Start the app
Type "node dist/cli.js TEST.md"
Enter
Sleep 15s

# Record a smooth scroll through the document
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
Down 10
Sleep 2s

# Quit
Type "q"
Sleep 2s
