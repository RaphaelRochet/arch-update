# Makefile of the Arch Linux Updates Indicator GNOME Shell Extension
# (adapted from https://gitlab.com/skrewball/openweather/)

PKG_NAME = arch-update
UUID = arch-update@RaphaelRochet
BASE_MODULES = metadata.json LICENCE.txt prefs.xml
SRC_MODULES = extension.js prefs.js stylesheet.css
EXTRA_DIRECTORIES = icons
TOLOCALIZE = extension.js prefs.js
MSGSRC = $(wildcard locale/*/arch-update.po)

# Packagers: Use DESTDIR for system wide installation
ifeq ($(strip $(DESTDIR)),)
	INSTALLTYPE = local
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
	INSTALLTYPE = system
	SHARE_PREFIX = $(DESTDIR)/usr/share
	INSTALLBASE = $(SHARE_PREFIX)/gnome-shell/extensions
endif
# Set a git version for self builds from the latest git tag with the revision
# (a monotonically increasing number that uniquely identifies the source tree)
# and the current short commit SHA1. (Note: not set if VERSION passed)
GIT_VER = $(shell git describe --long --tags | sed 's/^v//;s/\([^-]*-g\)/r\1/;s/-/./g')
# The command line passed variable VERSION is used to set the version integer
# in the metadata and in the generated zip file. If no VERSION is passed, we
# won't touch the metadata version and instead use that for the zip file.
ifdef VERSION
	ZIPVER = -v$(VERSION)
else
	ZIPVER = -v$(shell cat metadata.json | sed '/"version"/!d' | sed s/\"version\"://g | sed s/\ //g)
endif

.PHONY: all clean extension potfile mergepo install install-local zip-file

all: extension

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./locale/*/arch-update.po~
	rm -f ./locale/*/LC_MESSAGES/arch-update.mo

extension: ./schemas/gschemas.compiled $(MSGSRC:arch-update.po=LC_MESSAGES/arch-update.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.arch-update.gschema.xml
	glib-compile-schemas ./schemas/

# TODO: disabled, since xgettext is not able to include prefs.xml to the pot file
# We have to update the arch-update.pot manually.
#potfile: ./locale/arch-update.pot

mergepo: potfile
	for l in $(MSGSRC); do \
		msgmerge -U $$l ./locale/arch-update.pot; \
	done;

./locale/arch-update.pot: $(TOLOCALIZE)
	mkdir -p locale
	xgettext -k_ -kN_ --from-code utf-8 -o locale/arch-update.pot --package-name $(PKG_NAME) $(TOLOCALIZE)

./locale/%/LC_MESSAGES/arch-update.mo: ./locale/%/arch-update.po
	msgfmt -c $< -o $@

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(UUID)
	mkdir -p $(INSTALLBASE)/$(UUID)
	cp -r ./_build/* $(INSTALLBASE)/$(UUID)/
ifeq ($(INSTALLTYPE),system)
	# system-wide settings and locale files
	rm -r  $(addprefix $(INSTALLBASE)/$(UUID)/, schemas locale COPYING)
	mkdir -p $(SHARE_PREFIX)/glib-2.0/schemas \
		$(SHARE_PREFIX)/locale \
		$(SHARE_PREFIX)/licenses/$(PKG_NAME)
	cp -r ./schemas/*gschema.xml $(SHARE_PREFIX)/glib-2.0/schemas
	cp -r ./_build/locale/* $(SHARE_PREFIX)/locale
	cp -r ./_build/COPYING $(SHARE_PREFIX)/licenses/$(PKG_NAME)
endif
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(PKG_NAME)$(ZIPVER).zip" .
	mv _build/$(PKG_NAME)$(ZIPVER).zip ./
	-rm -fR _build

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) $(SRC_MODULES) _build
	cp -r $(EXTRA_DIRECTORIES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas
	cp schemas/gschemas.compiled _build/schemas
	for l in $(MSGSRC:arch-update.po=LC_MESSAGES/arch-update.mo) ; do \
		cp -au --parents $$l _build; \
	done;
ifdef VERSION
	sed -i 's/"version": .*/"version": $(VERSION)/' _build/metadata.json;
else ifneq ($(strip $(GIT_VER)),)
	sed -i '/"version": .*/i\ \ "git-version": "$(GIT_VER)",' _build/metadata.json;
endif