import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, HabitTrackerPluginSettings, HabitTrackerSettingTab} from "./settings";
import {PluginData} from "./types";
import {HabitModal} from "./HabitModal";
import {HabitTrackerView, VIEW_TYPE_HABIT_TRACKER} from "./HabitTrackerView";
import {toLocalDateString} from "./utils";

const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_MINUTE_IN_SECONDS = 60;

const DEFAULT_DATA: PluginData = {
	habits: [],
	logs: {},
};

export default class HabitTrackerPlugin extends Plugin {
	settings: HabitTrackerPluginSettings;
	data: PluginData;

	async onload() {
		await this.initData();

		this.registerView(
			VIEW_TYPE_HABIT_TRACKER,
			(leaf) => new HabitTrackerView(leaf, this),
		);

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
				new HabitModal(this.app, this, () => this.getTrackerView()?.render()).open();
			},
		});

		this.addSettingTab(new HabitTrackerSettingTab(this.app, this));

		// Check every minute if the we rolled over to the next day and update if necessary
		this.registerInterval(window.setInterval(
			() => this.checkDateRollover(),
			ONE_MINUTE_IN_SECONDS * ONE_SECOND_IN_MILLISECONDS
		));
	}

	onunload() {
	}

	private getTrackerView(): HabitTrackerView | undefined {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_HABIT_TRACKER)[0];
		return leaf?.view instanceof HabitTrackerView ? leaf.view : undefined;
	}

	async activateView(): Promise<void> {
		const {workspace} = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_HABIT_TRACKER)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
			await leaf.setViewState({type: VIEW_TYPE_HABIT_TRACKER, active: true});
		}
		workspace.revealLeaf(leaf);
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
		this.refreshView();
	}

	refreshView(): void {
		this.getTrackerView()?.render();
	}

	private checkDateRollover(): void {
		const view = this.getTrackerView();
		if (!view) return;
		const today = toLocalDateString(new Date());
		if (view.lastRenderedDate !== today) {
			view.render();
		}
	}

	// Called after data mutations (add/delete/toggle habit)
	async savePluginData(): Promise<void> {
		await this.persist();
	}
}
