import {ItemView, WorkspaceLeaf} from 'obsidian';
import HabitTrackerPlugin from './main';
import {Habit} from './types';
import {toggleHabitDate, getStreak} from './database';
import {HabitModal} from './HabitModal';
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

		// Header row with title and add button
		const header = this.contentEl.createDiv({cls: 'habit-tracker-header'});
		header.createEl('span', {text: 'Habit tracker', cls: 'habit-tracker-title'});
		const addBtn = header.createEl('button', {text: '+', cls: 'habit-tracker-add-btn'});
		addBtn.addEventListener('click', () => {
			new HabitModal(this.plugin.app, this.plugin, () => this.render()).open();
		});

		// Generate the rolling date window
		const dates = this.generateDates();

		// Scrollable table wrapper
		const wrapper = this.contentEl.createDiv({cls: 'habit-tracker-table-wrapper'});
		const table = wrapper.createEl('table', {cls: 'habit-tracker-table'});

		// Table header row
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', {text: '', cls: 'habit-tracker-name-col'});
		for (const date of dates) {
			const th = headerRow.createEl('th', {
				text: this.formatDate(date),
				cls: 'habit-tracker-date-col',
			});
			if (this.isToday(date)) {
				th.addClass('habit-tracker-today');
			}
		}

		// Table body rows
		const tbody = table.createEl('tbody');
		const habits = this.plugin.settings.showArchived
			? this.plugin.data.habits
			: this.plugin.data.habits.filter(h => !h.archived);

		if (habits.length === 0) {
			const emptyRow = tbody.createEl('tr');
			const emptyCell = emptyRow.createEl('td', {
				text: 'No habits yet. Click + to add one.',
				cls: 'habit-tracker-empty',
			});
			emptyCell.setAttribute('colspan', String(dates.length + 1));
		} else {
			for (const habit of habits) {
				this.renderHabitRow(tbody, habit, dates);
			}
		}

		// Restore scroll position after table is fully generated
		wrapper.scrollLeft = scrollLeft;
	}

	private renderHabitRow(tbody: HTMLElement, habit: Habit, dates: string[]): void {
		const row = tbody.createEl('tr', {cls: 'habit-tracker-row'});
		const nameCell = row.createEl('td', {cls: 'habit-tracker-name'});
		const nameSpan = nameCell.createEl('span', {text: habit.name, cls: 'habit-tracker-name-text'});
		nameSpan.addEventListener('click', () => {
			new HabitModal(this.plugin.app, this.plugin, () => this.render(), habit).open();
		});
		const streak = getStreak(this.plugin.data, habit.id);
		if (streak > 0) {
			nameCell.createEl('span', {
				text: String(streak),
				cls: 'habit-tracker-streak',
			});
		}

		const completedDates = this.plugin.data.logs[habit.id] ?? [];
		for (const date of dates) {
			const isCompleted = completedDates.includes(date);
			const cell = row.createEl('td', {
				cls: `habit-tracker-cell${isCompleted ? ' habit-tracker-cell--completed' : ''}`,
				text: isCompleted ? '✓' : '',
			});
			if (this.isToday(date)) {
				cell.addClass('habit-tracker-today');
			}
			cell.addEventListener('click', async () => {
				toggleHabitDate(this.plugin.data, habit.id, date);
				await this.plugin.savePluginData();
				this.render();
			});
		}
	}

	// Returns an array of date strings from today back to (today - windowSize), newest first
	private generateDates(): string[] {
		const dates: string[] = [];
		const today = new Date();
		const windowSize = this.plugin.settings.dateWindowSize;
		for (let i = 0; i < windowSize; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			dates.push(this.toDateString(date));
		}
		return dates;
	}

	// Formats a YYYY-MM-DD string using the dateFormat setting (e.g. "M/D" → "3/17")
	private formatDate(dateStr: string): string {
		const [, month, day] = dateStr.split('-').map(Number);
		return this.plugin.settings.dateFormat
			.replace('M', String(month))
			.replace('D', String(day));
	}

	private toDateString(date: Date): string {
		return toLocalDateString(date);
	}

	private isToday(dateStr: string): boolean {
		return dateStr === this.toDateString(new Date());
	}
}
