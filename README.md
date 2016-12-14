# arch-update
Update indicator for Arch Linux and GNOME Shell

## Features
- Uses pacman's «checkupdates» by default and thus does not need root access
- Optional update count display on panel
- Optional notification on new updates (defaults to off)
- Launcher for your favorite update command
- Comes in English, French, Czech, German, Spanish, Brazilian Portuguese, Italian, Polish, Romanian, Arabic, Slovak, Chinese, Serbian, Norwegian Bokmal, Russian languages. (Thanks translators !)

## One-click install
It's on extensions.gnome.org :
https://extensions.gnome.org/extension/1010/archlinux-updates-indicator/

## Install from AUR
Thanks to michiwend you can install it from Arch Linux User Repository : gnome-shell-extension-arch-update
https://aur.archlinux.org/packages/gnome-shell-extension-arch-update/

## Manual install
To install, simply download as zip and unzip contents in ~/.local/share/gnome-shell/extensions/arch-update@RaphaelRochet

## Changes

### v19
- Ability to cancel checking
- New translation : Catalan
- Updated translations : Spanish, Brazilian

### v18
- Gnome 3.22
- New preferences window
- Cleaner translations (some text are not translated yet)
- Menu does not close when updating

### v17
- New translation : Russian
- Updated translation : Czech

### v16
- Add vertical scroll bar on preferences window

### v15
- New feature : auto-expand update list
- New translation : Norwegian Bokmal
- Updated translation : Brazilian Portuguese

### v14
- Gnome 3.20 compatibility

### v13
- New translation : Serbian (sr and sr@latin)
- Updated translation : Spanish
- Minor bug fix

### v12
- New translation : Chinese
- Updated translation : Czech

### v11
- New option to strip out version numbers
- New translations : Slovak and Arabic
- Updated translations : Brazilian Portuguese, German

### v10
- Licence added : GNU GPL v3
- Updated translations : Polish and Brazilian portuguese

### v9
- Added option to change command used to check for updates (for advanced users)
- Added Romanian and Polish translations

### v8
- Added Italian language

### v7
- Added Brazilian Portuguese translation

### v6
- Added Spanish language

### v5
- Option to have permanent notifications
- Asynchronous checking - No more 1 sec Shell freeze during updates check !
- 'Updates pending' menu item can now be expanded to show updates list
- Option to only list new updates in notifications
- Aded "Update Now" action button on notifications

### v4
- Run update command from indicator
- Autodetect when updates are done
- Prefs dialog reworked

### v3
- Notification option
- Czech and German languages added

## Credits
All icons are based on Thayer Williams' Archer logo, winner of Arch Linux logo contest.

Some portions of the extension were inspired from Touchad Indicator and Lock keys. 
https://github.com/orangeshirt/gnome-shell-extension-touchpad-indicator
https://github.com/kazysmaster/gnome-shell-extension-lockkeys
