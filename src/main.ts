import {MarkdownRenderChild, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, HabitTrackerPluginSettings, HabitTrackerSettingTab} from "./ui/settings";
import {PluginData} from "./types";
import {HabitModal} from "./ui/HabitModal";
import {HabitTrackerView, VIEW_TYPE_HABIT_TRACKER} from "./ui/HabitTrackerView";
import {renderHabitTable} from "./ui/renderHabitTable";
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

	// Render callbacks registered by active habit-tracker code blocks
	private codeBlockRenderers = new Set<() => void>();

	/*
	 * Lifecycle functions
	 */
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
				new HabitModal(this.app, this, () => this.refreshAll()).open();
			},
		});

		this.addSettingTab(new HabitTrackerSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor('habit-tracker', (_source, el, ctx) => {
			const render = () => {
				const scrollLeft = el.querySelector('.habit-tracker-table-wrapper')?.scrollLeft ?? 0;
				el.empty();
				renderHabitTable(el, this, () => this.refreshAll());
				const wrapper = el.querySelector('.habit-tracker-table-wrapper');
				if (wrapper) wrapper.scrollLeft = scrollLeft;
			};
			render();

			// Register this code block's render function so refreshAll() can reach it
			this.codeBlockRenderers.add(render);

			// Unregister when the note containing this code block is closed
			const child = new MarkdownRenderChild(el);
			child.onunload = () => this.codeBlockRenderers.delete(render);
			ctx.addChild(child);
		});

		// Check every minute if we rolled over to the next day and update if necessary
		this.registerInterval(window.setInterval(
			() => this.checkDateRollover(),
			ONE_MINUTE_IN_SECONDS * ONE_SECOND_IN_MILLISECONDS
		));
	}

	onunload() {
	}

	/*
	 * Public API functions
	 */
	async activateView(): Promise<void> {
		const {workspace} = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_HABIT_TRACKER)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
			await leaf.setViewState({type: VIEW_TYPE_HABIT_TRACKER, active: true});
		}
		workspace.revealLeaf(leaf);
	}

	// Called by HabitTrackerSettingTab after settings changes
	async saveSettings(): Promise<void> {
		await this.persist();
		this.refreshAll();
	}

	// Called after data mutations (add/delete/toggle habit)
	async savePluginData(): Promise<void> {
		await this.persist();
	}

	// Refreshes the sidebar view and all active code blocks
	refreshAll(): void {
		this.refreshView();
		this.refreshCodeBlocks();
	}

	refreshView(): void {
		this.getTrackerView()?.render();
	}

	/*
	 * Private helper functions
	 */
	private async initData(): Promise<void> {
		const saved = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved?.settings);
		this.data = Object.assign({}, DEFAULT_DATA, saved?.data);
	}

	private async persist(): Promise<void> {
		await this.saveData({ settings: this.settings, data: this.data });
	}

	private getTrackerView(): HabitTrackerView | undefined {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_HABIT_TRACKER)[0];
		return leaf?.view instanceof HabitTrackerView ? leaf.view : undefined;
	}

	private refreshCodeBlocks(): void {
		for (const render of this.codeBlockRenderers) {
			render();
		}
	}

	private checkDateRollover(): void {
		const view = this.getTrackerView();
		if (!view) return;
		const today = toLocalDateString(new Date());
		if (view.lastRenderedDate !== today) {
			this.refreshAll();
		}
	}
}
