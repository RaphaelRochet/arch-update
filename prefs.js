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

	let etq_notify = new Gtk.Label({
		label: _("Send a notification when new updates are available"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_notify = new Gtk.Switch({
		active: false
	});
	settings.bind('notify' , field_notify , 'active' , Gio.SettingsBindFlags.DEFAULT);

	let etq_howmuch = new Gtk.Label({
		label: _("How much information to show on notifications"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_howmuch = new Gtk.ComboBoxText();
	let howmuch_values = { 0: _("Count only"), 1: _("Packages names") } ;
	for (let id in howmuch_values) {
		field_howmuch.append(id, howmuch_values[id]);
	}
	//field_howmuch.set_active_id('default');
	settings.bind('howmuch', field_howmuch, 'active', Gio.SettingsBindFlags.DEFAULT);

	let etq_updateCmd = new Gtk.Label({
		label: _("Command to update packages"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_updateCmd = new Gtk.Entry();
	settings.bind('update-cmd' , field_updateCmd , 'text' , Gio.SettingsBindFlags.DEFAULT);

	let etq_terminalCmd = new Gtk.Label({
		label: _("Command to open a terminal"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_terminalCmd = new Gtk.Entry();
	settings.bind('terminal-cmd' , field_terminalCmd , 'text' , Gio.SettingsBindFlags.DEFAULT);

	grid.attach(etq_wait          , 2, 1, 2, 1);
	grid.attach(field_wait        , 4, 1, 2, 1);
	grid.attach(etq_interval      , 2, 2, 2, 1);
	grid.attach(field_interval    , 4, 2, 2, 1);
	grid.attach(etq_visible       , 2, 3, 2, 1);
	grid.attach(field_visible     , 4, 3, 2, 1);
	grid.attach(etq_count         , 2, 4, 2, 1);
	grid.attach(field_count       , 4, 4, 2, 1);
	grid.attach(etq_notify        , 2, 5, 2, 1);
	grid.attach(field_notify      , 4, 5, 2, 1);
	grid.attach(etq_howmuch       , 2, 6, 2, 1);
	grid.attach(field_howmuch     , 4, 6, 2, 1);
	grid.attach(etq_updateCmd     , 2, 7, 2, 1);
	grid.attach(field_updateCmd   , 4, 7, 2, 1);
	grid.attach(etq_terminalCmd   , 2, 8, 2, 1);
	grid.attach(field_terminalCmd , 4, 8, 2, 1);
	
	grid.show_all();

	return grid;
};

