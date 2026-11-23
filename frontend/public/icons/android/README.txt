RIVA Android adaptive icon layers — reference assets.

No native Android project exists in this repository. Android web installs use
/icons/icon-512-maskable.png through the PWA manifest. If a native Android
wrapper is added, these are the approved layers:

  foreground  transparent, symbol inside the central 66 dp safe zone
  background  solid brand surface (#101C2C dark / #F7F7F3 light)
  canvas      432 x 432 px = 108 dp at 4x

Files:
  ic-launcher-foreground-{light,dark}-432.png / .svg
  ic-launcher-background-{light,dark}-432.png / .svg

Do not stretch or re-colour the layers. The symbol geometry is the approved
RIVA mark; see RIVA-Brand-Assets/04-App-Icons/README.md.
