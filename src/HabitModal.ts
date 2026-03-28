import {App, Modal, Notice, Setting} from "obsidian";
import {addHabit, updateHabit} from "./database";
import type HabitTrackerPlugin from "./main";
import type {Habit} from "./types";

export class HabitModal extends Modal {
	private readonly plugin: HabitTrackerPlugin;
	private readonly habit?: Habit;
	private readonly onSave?: () => void;

	constructor(app: App, plugin: HabitTrackerPlugin, onSave?: () => void, habit?: Habit) {
		super(app);
		this.plugin = plugin;
		this.habit = habit;
		this.onSave = onSave;
	}

	onOpen(): void {
		const {contentEl} = this;
		const isEditing = !!this.habit;
		contentEl.empty();
		contentEl.createEl("h2", {text: isEditing ? "Edit habit" : "Add habit"});

		let name = this.habit?.name ?? "";
		let color = this.habit?.color ?? "";
		let archived = this.habit?.archived ?? false;

		new Setting(contentEl)
			.setName("Habit name")
			.addText((text) => {
				text.setPlaceholder("Read");
				text.setValue(name);
				text.onChange((value) => {
					name = value.trim();
				});
			});

		new Setting(contentEl)
			.setName("Color (optional)")
			.addText((text) => {
				text.setPlaceholder("#ffd000");
				text.setValue(color);
				text.onChange((value) => {
					color = value.trim();
				});
			});

		if (isEditing) {
			new Setting(contentEl)
				.setName("Archived")
				.setDesc("Archived habits are hidden from the tracker by default.")
				.addToggle((toggle) => {
					toggle.setValue(archived);
					toggle.onChange((value) => {
						archived = value;
					});
				});
		}

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText(isEditing ? "Save" : "Add").setCta().onClick(async () => {
					if (!name) {
						new Notice("Habit name is required.");
						return;
					}

					if (isEditing && this.habit) {
						updateHabit(this.plugin.data, this.habit.id, {
							name,
							color: color || undefined,
							archived,
						});
					} else {
						addHabit(this.plugin.data, name, color || undefined);
					}

					await this.plugin.savePluginData();
					this.onSave?.();
					this.close();
				});
			})
			.addButton((button) => {
				button.setButtonText("Cancel").onClick(() => this.close());
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
