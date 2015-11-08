/* 
	Archlinux Updates checker 
*/

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;

const St = imports.gi.St;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let BOOT_WAIT		   = 15;      // 15s
let CHECK_INTERVAL     = 60*60;   // 1h

function init() {
	// TODO : Translation init
}

const ArchUpdateIndicator = new Lang.Class({
	Name: 'ArchUpdateIndicator',
	Extends: PanelMenu.Button,

	_TimeoutId: null,
	_FirstTimeoutId: null,
	_UpdatesPending: 0,

	_init: function() {
		this.parent(0.0, "ArchUpdateIndicator");
		Gtk.IconTheme.get_default().append_search_path(Me.dir.get_child('icons').get_path());

		this.updateIcon = new St.Icon({icon_name: "arch-uptodate-symbolic", style_class: 'system-status-icon'});

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

		this.menu.addMenuItem(this.menuLabel);
		this.menu.addMenuItem(this.updatesSection);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(this.checkNowMenuItem);

		this.checkNowMenuItem.connect('activate', Lang.bind(this, this._checkUpdates));

		// Start checking
		let that = this;
		this._FirstTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, BOOT_WAIT, function () {
			that._checkUpdates();
			that._FirstTimeoutId = null;
			return false; // Run once
		});
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

	_updateStatus: function(updatesCount) {
		
		if (updatesCount > 0) {
			// Updates pending
			this.updateIcon.set_icon_name('arch-updates-symbolic');
			this.label.set_text(updatesCount.toString());
			this.menuLabel.label.set_text(updatesCount.toString() + ' updates pending');
			this.actor.visible = true;
			
		} else if (updatesCount < 0) {
			// Error
			this.updateIcon.set_icon_name('arch-fade-symbolic');
			this.menuLabel.label.set_text('Error');
			this.actor.visible = false;
		
		} else {
			// Up to date
			this.updateIcon.set_icon_name('arch-uptodate-symbolic');
			this.label.set_text('');
			this.menuLabel.label.set_text('Up to date :)');
			this.actor.visible = true;
		}
	
	},

	_checkUpdates: function() {
		this.updateIcon.set_icon_name('arch-fade-symbolic');
		try {
		
			this.output = GLib.spawn_command_line_sync('checkupdates');
			
			// One package per line so number of updates is easy to compute
			let lines = this.output[1].toString().split("\n");
			if (lines.length >= 2) {
				this._updateStatus(lines.length - 1);
			} else {
				this._updateStatus(0);
			}
			
		} catch (err) {
			// TODO log err.message.toString() ?
			this._updateStatus(-1);
		}
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
