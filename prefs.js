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
	let box = buildable.get_object('vbox_built');

	// Bind fields to settings
	settings.bind('boot-wait' , buildable.get_object('field_wait') , 'value' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('check-interval' , buildable.get_object('field_interval') , 'value' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('always-visible' , buildable.get_object('field_visible') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('show-count' , buildable.get_object('field_count') , 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('notify' , buildable.get_object('field_notify') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('howmuch', buildable.get_object('field_howmuch'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('transient', buildable.get_object('field_transient'), 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('update-cmd' , buildable.get_object('field_updatecmd') , 'text' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('pacman-dir' , buildable.get_object('field_pacmandir') , 'text' , Gio.SettingsBindFlags.DEFAULT);

	box.show_all();
	return box;
};

