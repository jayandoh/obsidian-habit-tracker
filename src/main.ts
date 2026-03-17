import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, HabitTrackerPluginSettings, HabitTrackerSettingTab} from "./settings";
import {PluginData} from "./types";
import {HabitModal} from "./HabitModal";

const DEFAULT_DATA: PluginData = {
	habits: [],
	logs: {},
};

export default class HabitTrackerPlugin extends Plugin {
	settings: HabitTrackerPluginSettings;
	data: PluginData;

	async onload() {
		await this.initData();

		this.addRibbonIcon('check-square', 'Habit Tracker', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-habit-tracker',
			name: 'Open habit tracker',
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: 'add-habit',
			name: 'Add habit',
			callback: () => {
				new HabitModal(this.app, this).open();
			},
		});

		this.addSettingTab(new HabitTrackerSettingTab(this.app, this));
	}

	onunload() {
	}

	async activateView(): Promise<void> {
		// TODO: register and activate HabitTrackerView
	}

	private async initData(): Promise<void> {
		const saved = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved?.settings);
		this.data = Object.assign({}, DEFAULT_DATA, saved?.data);
	}

	private async persist(): Promise<void> {
		await this.saveData({ settings: this.settings, data: this.data });
	}

	// Called by HabitTrackerSettingTab after settings changes
	async saveSettings(): Promise<void> {
		await this.persist();
	}

	// Called after data mutations (add/delete/toggle habit)
	async savePluginData(): Promise<void> {
		await this.persist();
	}
}
