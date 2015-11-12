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

let ALWAYS_VISIBLE     = true;
let SHOW_COUNT         = true;
let BOOT_WAIT		   = 15;      // 15s
let CHECK_INTERVAL     = 60*60;   // 1h
let NOTIFY             = false;
let HOWMUCH            = 0;
let UPDATE_CMD         = "gnome-terminal -e 'sh -c  \"sudo pacman -Syu ; echo Done - Press enter to exit; read\" '";

let FIRST_BOOT         = 1;
let UPDATES_PENDING    = -1;
let PACMAN_DIR         = "/var/lib/pacman/local";

function init() {
	Utils.initTranslations("arch-update");
}

const ArchUpdateIndicator = new Lang.Class({
	Name: 'ArchUpdateIndicator',
	Extends: PanelMenu.Button,

	_TimeoutId: null,
	_FirstTimeoutId: null,

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
		
		// Create the menu
		this.menuLabel = new PopupMenu.PopupMenuItem( _('Waiting first check'), { reactive: false } );
		this.updatesSection = new PopupMenu.PopupMenuSection();
		this.checkNowMenuItem = new PopupMenu.PopupMenuItem(_('Check now'));
		let settingsMenuItem = new PopupMenu.PopupMenuItem(_('Settings'));
		let updateNowMenuItem = new PopupMenu.PopupMenuItem(_("Update now"));

		this.menu.addMenuItem(this.menuLabel);
		this.menu.addMenuItem(this.updatesSection);
		this.menu.addMenuItem(updateNowMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(this.checkNowMenuItem);
		this.menu.addMenuItem(settingsMenuItem);

		this.checkNowMenuItem.connect('activate', Lang.bind(this, this._checkUpdates));
		settingsMenuItem.connect('activate', Lang.bind(this, this._openSettings));
		updateNowMenuItem.connect('activate', Lang.bind(this, this._updateNow));

		// Load settings
		this._settings = Utils.getSettings();
		this._settingsChangedId = this._settings.connect('changed', Lang.bind(this, this._applySettings));
		this._applySettings();

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
			this._updateStatus();
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
		ALWAYS_VISIBLE     = this._settings.get_boolean('always-visible');
		SHOW_COUNT        = this._settings.get_boolean('show-count');
		BOOT_WAIT		   = this._settings.get_int('boot-wait');
		CHECK_INTERVAL     = 60 * this._settings.get_int('check-interval');
		NOTIFY = this._settings.get_boolean('notify');
		HOWMUCH = this._settings.get_int('howmuch');
		UPDATE_CMD = this._settings.get_string('update-cmd');
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
			this.label.set_text(updatesCount.toString());
			this.menuLabel.label.set_text(updatesCount.toString() + ' ' + _('updates pending') );
			if (NOTIFY && UPDATES_PENDING < updatesCount) {
				let message = '';
				if (HOWMUCH > 0) {
					message = this._updateList.slice(0, this._updateList.length-1).join(', ');
				} else {
					message = updatesCount.toString() + ' ' + _('updates pending') ;
				}
				this._showNotification(message);
			}
		} else if (updatesCount == -1) {
			// Unknown
			this.updateIcon.set_icon_name('arch-unknown-symbolic');
			this.menuLabel.label.set_text('');
		} else if (updatesCount == -2) {
			// Error
			this.updateIcon.set_icon_name('arch-error-symbolic');
			this.menuLabel.label.set_text(_('Error'));
		} else {
			// Up to date
			this.updateIcon.set_icon_name('arch-uptodate-symbolic');
			this.label.set_text('');
			this.menuLabel.label.set_text(_('Up to date :)'));
		}
		
		UPDATES_PENDING = updatesCount;
		this._checkShowHide();
	},

	_checkUpdates: function() {
		this.updateIcon.set_icon_name('arch-unknown-symbolic');
		try {
			this.menuLabel.label.set_text(_('Checking'));
			this.output = GLib.spawn_command_line_sync('checkupdates');
			
			// One package per line so number of updates is easy to compute
			this._updateList = this.output[1].toString().split("\n");
			if (this._updateList.length >= 2) {
				this._updateStatus(this._updateList.length - 1);
			} else {
				this._updateStatus(0);
			}
			
		} catch (err) {
			// TODO log err.message.toString() ?
			this._updateStatus(-2);
		}
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
			notification.setTransient(true); // Auto dismiss
		} else {
			notification = this._notifSource.notifications[0];
			notification.update(message, null, { clear: true });
		}
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
