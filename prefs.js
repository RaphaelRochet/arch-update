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

	let grid = new Gtk.Grid({ 
		margin: 10, row_spacing: 10, column_spacing: 20, column_homogeneous: false, row_homogeneous: true 
		});

	// Prepare labels and controls
	let etq_wait = new Gtk.Label({
		label: _("Time to wait before first check (seconds)"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_wait = new Gtk.SpinButton({
		adjustment: new Gtk.Adjustment({
			lower: 5,
			upper: 5000,
			step_increment: 1
		})
	});
	settings.bind('boot-wait' , field_wait , 'value' , Gio.SettingsBindFlags.DEFAULT);

	let etq_interval = new Gtk.Label({
		label: _("Interval between updates check (minutes)"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_interval = new Gtk.SpinButton({
		adjustment: new Gtk.Adjustment({
			lower: 30,
			upper: 2000,
			step_increment: 30
		})
	});
	settings.bind('check-interval' , field_interval , 'value' , Gio.SettingsBindFlags.DEFAULT);

	let etq_visible = new Gtk.Label({
		label: _("Always visible"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_visible = new Gtk.Switch({
		active: true
	});
	settings.bind('always-visible' , field_visible , 'active' , Gio.SettingsBindFlags.DEFAULT);

	let etq_count = new Gtk.Label({
		label: _("Show updates count on indicator"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_count = new Gtk.Switch({
		active: true
	});
	settings.bind('show-count' , field_count , 'active' , Gio.SettingsBindFlags.DEFAULT);
	
	grid.attach(etq_wait          , 2, 1, 2, 1);
	grid.attach(field_wait        , 4, 1, 2, 1);
	grid.attach(etq_interval      , 2, 2, 2, 1);
	grid.attach(field_interval    , 4, 2, 2, 1);
	grid.attach(etq_visible       , 2, 3, 2, 1);
	grid.attach(field_visible     , 4, 3, 2, 1);
	grid.attach(etq_count         , 2, 4, 2, 1);
	grid.attach(field_count       , 4, 4, 2, 1);
	
	grid.show_all();

	return grid;
};

