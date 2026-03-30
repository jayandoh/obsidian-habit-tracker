import {ItemView, WorkspaceLeaf} from 'obsidian';
import HabitTrackerPlugin from './main';
import {renderHabitTable} from './renderHabitTable';
import {toLocalDateString} from './utils';

export const VIEW_TYPE_HABIT_TRACKER = 'habit-tracker-view';

export class HabitTrackerView extends ItemView {
	plugin: HabitTrackerPlugin;
	lastRenderedDate: string = '';

	constructor(leaf: WorkspaceLeaf, plugin: HabitTrackerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	/*
	 * ItemView identity methods:
	 * getViewType(), getDisplayText(), getIcon()
	 */
	getViewType(): string {
		return VIEW_TYPE_HABIT_TRACKER;
	}

	getDisplayText(): string {
		return 'Habit tracker';
	}

	getIcon(): string {
		return 'check-square';
	}

	/*
	 * Lifecycle methods:
	 * onOpen(), onClose()
	 */
	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	render(): void {
		this.lastRenderedDate = toLocalDateString(new Date()); // used to detect date rollover

		// Preserve horizontal scroll position across re-renders
		const scrollLeft = this.contentEl.querySelector('.habit-tracker-table-wrapper')?.scrollLeft ?? 0;
		this.contentEl.empty();

		renderHabitTable(this.contentEl, this.plugin, () => this.render());

		// Restore scroll position after table is fully generated
		const wrapper = this.contentEl.querySelector('.habit-tracker-table-wrapper');
		if (wrapper) wrapper.scrollLeft = scrollLeft;
	}
}
