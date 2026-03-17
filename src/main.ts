import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, HabitTrackerPluginSettings, HabitTrackerSettingTab} from "./settings";

export default class HabitTrackerPlugin extends Plugin {
	settings: HabitTrackerPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('check-square', 'Habit Tracker', () => {
			// TODO: open habit tracker view
		});

		this.addSettingTab(new HabitTrackerSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<HabitTrackerPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
