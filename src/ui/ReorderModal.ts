import {App, Modal} from 'obsidian';
import type HabitTrackerPlugin from '../main';
import type {Habit} from '../types';

export class ReorderModal extends Modal {
	private readonly plugin: HabitTrackerPlugin;
	private readonly onReorder: () => void;

	constructor(app: App, plugin: HabitTrackerPlugin, onReorder: () => void) {
		super(app);
		this.plugin = plugin;
		this.onReorder = onReorder;
	}

	onOpen(): void {
		this.titleEl.setText('Reorder habits');
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const {contentEl} = this;
		contentEl.empty();
		const visible = this.plugin.data.habits.filter(h => !h.archived);
		if (visible.length === 0) {
			contentEl.createEl('p', {text: 'No habits to reorder.', cls: 'habit-reorder-empty'});
			return;
		}
		const list = contentEl.createDiv({cls: 'habit-reorder-list'});
		visible.forEach((habit, i) => {
			const row = list.createDiv({cls: 'habit-reorder-row'});
			const upBtn = row.createEl('button', {text: '↑', cls: 'habit-reorder-move-btn'});
			if (i === 0) upBtn.disabled = true;
			upBtn.addEventListener('click', () => this.move(habit, -1));
			const downBtn = row.createEl('button', {text: '↓', cls: 'habit-reorder-move-btn'});
			if (i === visible.length - 1) downBtn.disabled = true;
			downBtn.addEventListener('click', () => this.move(habit, 1));
			row.createEl('span', {text: habit.name, cls: 'habit-reorder-name'});
		});
	}

	private move(habit: Habit, direction: -1 | 1): void {
		const all = this.plugin.data.habits;
		const visible = all.filter(h => !h.archived);
		const visibleIdx = visible.indexOf(habit);
		const targetVisibleIdx = visibleIdx + direction;
		if (targetVisibleIdx < 0 || targetVisibleIdx >= visible.length) return;
		const idxA = all.indexOf(habit);
		const idxB = all.indexOf(visible[targetVisibleIdx]!);
		[all[idxA], all[idxB]] = [all[idxB]!, all[idxA]!];
		void this.plugin.savePluginData().then(() => {
			this.onReorder();
			this.render();
		});
	}
}
