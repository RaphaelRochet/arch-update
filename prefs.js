/*
    This file is part of Arch Linux Updates Indicator

    Arch Linux Updates Indicator is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Arch Linux Updates Indicator is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Arch Linux Updates Indicator.  If not, see <http://www.gnu.org/licenses/>.

    Copyright 2016 Raphaël Rochet
*/

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const Gettext = imports.gettext.domain('arch-update');
const _ = Gettext.gettext;

let settings;

function init() {
	settings = Utils.getSettings(Me);
	Utils.initTranslations("arch-update");
}

function buildPrefsWidget(){

	// Prepare labels and controls
	let buildable = new Gtk.Builder();
	buildable.add_from_file( Me.dir.get_path() + '/prefs.xml' );
	let box = buildable.get_object('prefs_widget');

	let version_label = buildable.get_object('version_info');
	version_label.set_text('[Arch-update v' + Me.metadata.version.toString() + ']');

	// Bind fields to settings
	settings.bind('boot-wait' , buildable.get_object('field_wait') , 'value' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('check-interval' , buildable.get_object('field_interval') , 'value' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('always-visible' , buildable.get_object('field_visible') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('show-count' , buildable.get_object('field_count') , 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('notify' , buildable.get_object('field_notify') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('howmuch', buildable.get_object('field_howmuch'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('transient', buildable.get_object('field_transient'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('strip-versions' , buildable.get_object('field_stripversions') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('check-cmd' , buildable.get_object('field_checkcmd') , 'text' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('update-cmd' , buildable.get_object('field_updatecmd') , 'text' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('pacman-dir' , buildable.get_object('field_pacmandir') , 'text' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('auto-expand-list', buildable.get_object('field_autoexpandlist'), 'value', Gio.SettingsBindFlags.DEFAULT);

	box.show_all();
	return box;
};

