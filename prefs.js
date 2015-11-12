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

	let etq_visible = new Gtk.Label({
		label: _("Always visible"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_visible = new Gtk.Switch({
		active: true
	});

	let etq_count = new Gtk.Label({
		label: _("Show updates count on indicator"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_count = new Gtk.Switch({
		active: true
	});

	let etq_notify = new Gtk.Label({
		label: _("Send a notification when new updates are available"),
		hexpand: true,
		halign: Gtk.Align.START
	});
	let field_notify = new Gtk.Switch({
		active: false
	});

	let hbox_howmuch = new Gtk.HBox();
	hbox_howmuch.pack_start(
		new Gtk.Label({
			label: _("How much information to show on notifications"),
			hexpand: true,
			halign: Gtk.Align.START
		})
	, true, true, 0);
	let field_howmuch = new Gtk.ComboBoxText();
	let howmuch_values = { 0: _("Count only"), 1: _("Packages names") } ;
	for (let id in howmuch_values) {
		field_howmuch.append(id, howmuch_values[id]);
	}
	hbox_howmuch.add(field_howmuch);

	let vbox_updatecmd = new Gtk.VBox();
	vbox_updatecmd.pack_start(
		new Gtk.Label({
			label: _("Command to update packages"),
			hexpand: true,
			halign: Gtk.Align.START
		})
	, true, true, 0);
	let field_updatecmd = new Gtk.Entry();
	vbox_updatecmd.add(field_updatecmd);

	let vbox_pacmandir = new Gtk.VBox();
	vbox_pacmandir.pack_start(
		new Gtk.Label({
			label: _("Pacman local directory path - To detect when new packages are installed"),
			hexpand: true,
			halign: Gtk.Align.START
		})
	, true, true, 0);
	let field_pacmandir = new Gtk.Entry();
	vbox_pacmandir.add(field_pacmandir);

	// Bind fields to settings
	settings.bind('boot-wait' , field_wait , 'value' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('check-interval' , field_interval , 'value' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('always-visible' , field_visible , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('show-count' , field_count , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('notify' , field_notify , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('howmuch', field_howmuch, 'active', Gio.SettingsBindFlags.DEFAULT);
	settings.bind('update-cmd' , field_updatecmd , 'text' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('pacman-dir' , field_pacmandir , 'text' , Gio.SettingsBindFlags.DEFAULT);

	let grid = new Gtk.Grid({
		margin: 0, row_spacing: 10, column_spacing: 20, column_homogeneous: false, row_homogeneous: true
	});
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
	
	let vbox = new Gtk.VBox( {margin: 10, spacing: 10} );
	vbox.add(grid);
	vbox.add(hbox_howmuch);
	vbox.add(vbox_updatecmd);
	vbox.add(vbox_pacmandir);
	
	vbox.show_all();

	return vbox;
};

