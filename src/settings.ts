import {App, PluginSettingTab, Setting} from "obsidian";
import HabitTrackerPlugin from "./main";

export interface HabitTrackerPluginSettings {
	dateWindowSize: number;   // Number of days to show as columns
	dateFormat: string;       // Format for column headers (e.g. M/D)
	showArchived: boolean;    // Whether to show archived habits
}

export const DEFAULT_SETTINGS: HabitTrackerPluginSettings = {
	dateWindowSize: 30,
	dateFormat: 'M/D',
	showArchived: false,
}

export class HabitTrackerSettingTab extends PluginSettingTab {
	plugin: HabitTrackerPlugin;

	constructor(app: App, plugin: HabitTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Date window size')
			.setDesc('Number of days to display as columns in the tracker.')
			.addText(text => text
				.setPlaceholder('30')
				.setValue(String(this.plugin.settings.dateWindowSize))
				.onChange(async (value) => {
					const parsed = parseInt(value);
					if (!isNaN(parsed) && parsed > 0) {
						this.plugin.settings.dateWindowSize = parsed;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Format for date column headers (e.g. M/D).')
			.addText(text => text
				.setPlaceholder('M/D')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show archived habits')
			.setDesc('Include archived habits in the tracker view.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showArchived)
				.onChange(async (value) => {
					this.plugin.settings.showArchived = value;
					await this.plugin.saveSettings();
				}));
	}
}
