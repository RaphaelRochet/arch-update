/*
	Arch Linux Updates checker
*/

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;

const St = imports.gi.St;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;

const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const Gettext = imports.gettext.domain('arch-update');
const _ = Gettext.gettext;

/* Options */
let ALWAYS_VISIBLE     = true;
let SHOW_COUNT         = true;
let BOOT_WAIT		   = 15;      // 15s
let CHECK_INTERVAL     = 60*60;   // 1h
let NOTIFY             = false;
let HOWMUCH            = 0;
let TRANSIENT          = true;
let UPDATE_CMD         = "gnome-terminal -e 'sh -c  \"sudo pacman -Syu ; echo Done - Press enter to exit; read\" '";
let CHECK_CMD          = "/usr/bin/checkupdates";
let PACMAN_DIR         = "/var/lib/pacman/local";

/* Variables we want to keep when extension is disabled (eg during screen lock) */
let FIRST_BOOT         = 1;
let UPDATES_PENDING    = -1;
let UPDATES_LIST       = [];


function init() {
	Utils.initTranslations("arch-update");
}

const ArchUpdateIndicator = new Lang.Class({
	Name: 'ArchUpdateIndicator',
	Extends: PanelMenu.Button,

	_TimeoutId: null,
	_FirstTimeoutId: null,
	_updateProcess_sourceId: null,
	_updateProcess_stream: null,

	_init: function() {
		this.parent(0.0, "ArchUpdateIndicator");
		Gtk.IconTheme.get_default().append_search_path(Me.dir.get_child('icons').get_path());

		this.updateIcon = new St.Icon({icon_name: "arch-unknown-symbolic", style_class: 'system-status-icon'});

		let box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		this.label = new St.Label({ text: '',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER });

		box.add_child(this.updateIcon);
		box.add_child(this.label);
		this.actor.add_child(box);

		// Prepare the special menu : a submenu for updates list that will look like a regular menu item when disabled
		// Scrollability will also be taken care of by the popupmenu
		this.menuExpander = new PopupMenu.PopupSubMenuMenuItem('');
		this.updatesListMenuLabel = new St.Label();
		this.menuExpander.menu.box.add(this.updatesListMenuLabel);
		this.menuExpander.menu.box.style_class = 'arch-updates-list';

		// Other standard menu items
		this.checkNowMenuItem = new PopupMenu.PopupMenuItem(_('Check now'));
		let settingsMenuItem = new PopupMenu.PopupMenuItem(_('Settings'));
		this.updateNowMenuItem = new PopupMenu.PopupMenuItem(_('Update now'));

		// Assemble all menu items into the popup menu
		this.menu.addMenuItem(this.menuExpander);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(this.updateNowMenuItem);
		this.menu.addMenuItem(this.checkNowMenuItem);
		this.menu.addMenuItem(settingsMenuItem);

		this.checkNowMenuItem.connect('activate', Lang.bind(this, this._checkUpdates));
		settingsMenuItem.connect('activate', Lang.bind(this, this._openSettings));
		this.updateNowMenuItem.connect('activate', Lang.bind(this, this._updateNow));

		// Load settings
		this._settings = Utils.getSettings();
		this._settingsChangedId = this._settings.connect('changed', Lang.bind(this, this._applySettings));
		this._applySettings();
		this._updateMenuExpander(false, _('Waiting first check'));

		if (FIRST_BOOT) {
			// Schedule first check only if this is the first extension load
			// This won't be run again if extension is disabled/enabled (like when screen is locked)
			let that = this;
			this._FirstTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, BOOT_WAIT, function () {
				that._checkUpdates();
				that._FirstTimeoutId = null;
				FIRST_BOOT = 0;
				that._startFolderMonitor();
				return false; // Run once
			});
		} else {
			// Restore previous state
			this._updateList = UPDATES_LIST;
			this._updateStatus(UPDATES_PENDING);
			this._startFolderMonitor();
		}
	},

	_openSettings: function () {
		Util.spawn([ "gnome-shell-extension-prefs", Me.uuid ]);
	},

	_updateNow: function () {
		Util.spawnCommandLine(UPDATE_CMD);
	},

	_applySettings: function() {
		ALWAYS_VISIBLE = this._settings.get_boolean('always-visible');
		SHOW_COUNT = this._settings.get_boolean('show-count');
		BOOT_WAIT = this._settings.get_int('boot-wait');
		CHECK_INTERVAL = 60 * this._settings.get_int('check-interval');
		NOTIFY = this._settings.get_boolean('notify');
		HOWMUCH = this._settings.get_int('howmuch');
		TRANSIENT = this._settings.get_boolean('transient');
		UPDATE_CMD = this._settings.get_string('update-cmd');
		CHECK_CMD = this._settings.get_string('check-cmd');
		PACMAN_DIR = this._settings.get_string('pacman-dir');
		this._checkShowHide();
		let that = this;
		if (this._TimeoutId) GLib.source_remove(this._TimeoutId);
		this._TimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, CHECK_INTERVAL, function () {
			that._checkUpdates();
			return true;
		});
	},

	destroy: function() {
		if (this._updateProcess_sourceId) {
			// We leave the checkupdate process end by itself but undef handles to avoid zombies
			GLib.source_remove(this._updateProcess_sourceId);
			this._updateProcess_sourceId = null;
			this._updateProcess_stream = null;
		}
		if (this._FirstTimeoutId) {
			GLib.source_remove(this._FirstTimeoutId);
			this._FirstTimeoutId = null;
		}
		if (this._TimeoutId) {
			GLib.source_remove(this._TimeoutId);
			this._TimeoutId = null;
		}
		this.parent();
	},

	_checkShowHide: function() {
		if (!ALWAYS_VISIBLE && UPDATES_PENDING < 1) {
			this.actor.visible = false;
		} else {
			this.actor.visible = true;
		}
		this.label.visible = SHOW_COUNT;
	},

	_startFolderMonitor: function() {
		if (PACMAN_DIR) {
			this.pacman_dir = Gio.file_new_for_path(PACMAN_DIR);
			this.monitor = this.pacman_dir.monitor_directory(0, null, null);
			this.monitor.connect('changed', Lang.bind(this, this._onFolderChanged));
		}
	},
	_onFolderChanged: function() {
		// Folder have changed ! Let's schedule a check in a few seconds
		let that = this;
		if (this._FirstTimeoutId) GLib.source_remove(this._FirstTimeoutId);
		this._FirstTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, function () {
			that._checkUpdates();
			that._FirstTimeoutId = null;
			return false;
		});
	},

	_updateStatus: function(updatesCount) {
		updatesCount = typeof updatesCount === 'number' ? updatesCount : UPDATES_PENDING;
		if (updatesCount > 0) {
			// Updates pending
			this.updateIcon.set_icon_name('arch-updates-symbolic');
			this._updateMenuExpander( true, updatesCount.toString() + ' ' + _('updates pending') );
			this.updatesListMenuLabel.set_text( this._updateList.join("\n") );
			this.label.set_text(updatesCount.toString());
			if (NOTIFY && UPDATES_PENDING < updatesCount) {
				let message = '';
				if (HOWMUCH > 0) {
					let updateList = [];
					if (HOWMUCH > 1) {
						updateList = this._updateList;
					} else {
						// Keep only packets that was not in the previous notification
						updateList = this._updateList.filter(function(pkg) { return UPDATES_LIST.indexOf(pkg) < 0 });
					}
					message = updateList.join(', ');
				} else {
					message = updatesCount.toString() + ' ' + _('updates pending') ;
				}
				this._showNotification(message);
			}
			// Store the new list
			UPDATES_LIST = this._updateList;
		} else {
			if (updatesCount == -1) {
				// Unknown
				this.updateIcon.set_icon_name('arch-unknown-symbolic');
				this._updateMenuExpander( false, '' );
			} else if (updatesCount == -2) {
				// Error
				this.updateIcon.set_icon_name('arch-error-symbolic');
				this._updateMenuExpander( false, _('Error') );
			} else {
				// Up to date
				this.updateIcon.set_icon_name('arch-uptodate-symbolic');
				this.label.set_text('');
				this._updateMenuExpander( false, _('Up to date :)') );
			}
			// Reset stored list
			UPDATES_LIST = [];
		}
		UPDATES_PENDING = updatesCount;
		this._checkShowHide();
	},

	_updateMenuExpander: function(enabled, label) {
		// We make our expander look like a regular menu label if disabled
		this.menuExpander.actor.reactive = enabled;
		this.menuExpander._triangle.visible = enabled;
		this.menuExpander.label.set_text(label);

		// 'Update now' visibility is linked so let's save a few lines and set it here
		this.updateNowMenuItem.actor.visible = enabled;
	},

	_checkUpdates: function() {
		this.updateIcon.set_icon_name('arch-unknown-symbolic');
		this._updateMenuExpander( false, _('Checking') );
		if(this.updateProcess_sourceId) {
			// A check is already running ! Maybe we should kill it and run another one ?
			return;
		}
		// Run asynchronously, to avoid  shell freeze - even for a 1s check
		try {
			// Parse check command line
			let [parseok, argvp] = GLib.shell_parse_argv( CHECK_CMD );
			if (!parseok) { throw 'Parse error' };
			let [res, pid, in_fd, out_fd, err_fd]  = GLib.spawn_async_with_pipes(null, argvp, null, GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);
			// Let's buffer the command's output - that's a input for us !
			this._updateProcess_stream = new Gio.DataInputStream({
				base_stream: new Gio.UnixInputStream({fd: out_fd})
			});
			// We will process the output at once when it's done
			this._updateProcess_sourceId = GLib.child_watch_add(0, pid, Lang.bind(this, function() {this._checkUpdatesEnd()}));
		} catch (err) {
			// TODO log err.message.toString() ?
			this._updateStatus(-2);
		}
	},

	_checkUpdatesEnd: function() {
		// Read the buffered output
		let updateList = [];
		let out, size;
		do {
			[out, size] = this._updateProcess_stream.read_line_utf8(null);
			if (out) updateList.push(out);
		} while (out);
		// Free resources
		this._updateProcess_stream.close(null);
		this._updateProcess_stream = null;
		GLib.source_remove(this.updateProcess_sourceId);
		this._updateProcess_sourceId = null;
		// Update indicator
		this._updateList = updateList;
		this._updateStatus(this._updateList.length);
	},

	_showNotification: function(message) {
		if (this._notifSource == null) {
			// We have to prepare this only once
			this._notifSource = new MessageTray.SystemNotificationSource();
			this._notifSource.createIcon = function() {
				return new St.Icon({ icon_name: 'arch-lit-symbolic' });
			};
			// Take care of note leaving unneeded sources
			this._notifSource.connect('destroy', Lang.bind(this, function() {this._notifSource = null;}));
			Main.messageTray.add(this._notifSource);
		}
		let notification = null;
		// We do not want to have multiple notifications stacked
		// instead we will update previous
		if (this._notifSource.notifications.length == 0) {
			notification = new MessageTray.Notification(this._notifSource, _('New Arch Linux Updates'), message);
			notification.addAction( _('Update now') , Lang.bind(this, function() {this._updateNow()}) );
		} else {
			notification = this._notifSource.notifications[0];
			notification.update(_('New Arch Linux Updates'), message, { clear: true });
		}
		notification.setTransient(TRANSIENT);
		this._notifSource.notify(notification);
	},


});

let archupdateindicator;

function enable() {
	archupdateindicator = new ArchUpdateIndicator();
	Main.panel.addToStatusArea('ArchUpdateIndicator', archupdateindicator);
}

function disable() {
	archupdateindicator.destroy();
}
