# crystal-update
Update indicator for Crystal Linux and GNOME Shell

## Warning for Gnome 42
Default update command tries to run "gnome-terminal".
You need to either install gnome-terminal or edit update command in advanced options to run Console. See wiki for examples.

## Features
- Uses pacman's «checkupdates» by default and thus does not need root access
- Optional update count display on panel
- Optional notification on new updates (defaults to off)
- Launcher for your favorite update command
- Comes in English, French, Czech, German, Spanish, Brazilian Portuguese, Italian, Polish, Romanian, Arabic, Slovak, Chinese, Serbian, Swedish, Norwegian Bokmal, Russian, Persian, Turkish, Esperanto, Finnish, Dutch, Ukrainian, Korean, Occitan, hungarian languages. (Thanks translators !)

## Requirements
If you use the default "checkupdates" way you will need to install "pacman-contrib".

## One-click install
It's on extensions.gnome.org :
https://extensions.gnome.org/extension/1010/archlinux-updates-indicator/

## Install from AUR
Thanks to michiwend you can install it from Crystal Linux User Repository : gnome-shell-extension-arch-update
https://aur.archlinux.org/packages/gnome-shell-extension-arch-update/

## Manual install
To install, simply download as zip and unzip contents in ~/.local/share/gnome-shell/extensions/arch-update@RaphaelRochet

## Credit
Some portions of the extension were inspired from Touchad Indicator and Lock keys. 
https://github.com/orangeshirt/gnome-shell-extension-touchpad-indicator
https://github.com/kazysmaster/gnome-shell-extension-lockkeys
