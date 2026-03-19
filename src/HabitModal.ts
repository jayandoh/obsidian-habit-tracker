import {App, Modal, Notice, Setting} from "obsidian";
import {addHabit} from "./database";
import type HabitTrackerPlugin from "./main";

export class HabitModal extends Modal {
	private readonly plugin: HabitTrackerPlugin;

	constructor(app: App, plugin: HabitTrackerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Add habit" });

		let name = "";
		let color = "";

		new Setting(contentEl)
			.setName("Habit name")
			.addText((text) => {
				text.setPlaceholder("Exercise");
				text.onChange((value) => {
					name = value.trim();
				});
			});

		new Setting(contentEl)
			.setName("Color (optional)")
			.addText((text) => {
				text.setPlaceholder("#22c55e");
				text.onChange((value) => {
					color = value.trim();
				});
			});

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText("Add").setCta().onClick(async () => {
					if (!name) {
						new Notice("Habit name is required.");
						return;
					}

					addHabit(this.plugin.data, name, color || undefined);
					await this.plugin.savePluginData();
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
