import {Modal, Notice, Setting} from "obsidian";
import type HabitTrackerPlugin from "./main";
import type {PluginData} from "./types";
import {detectDuplicates, mergeImport} from "./ImportExportService";
import {ConfirmModal} from "./HabitModal";

export class ImportModal extends Modal {
	private readonly plugin: HabitTrackerPlugin;
	private readonly imported: PluginData;

	constructor(plugin: HabitTrackerPlugin, imported: PluginData) {
		super(plugin.app);
		this.plugin = plugin;
		this.imported = imported;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Import habits"});

		new Setting(contentEl)
			.setName("Replace all")
			.setDesc("Permanently replace all existing habits and logs with the imported data.")
			.addButton(btn =>
				btn.setButtonText("Replace all").setWarning().onClick(() => {
					new ConfirmModal(
						this.app,
						"This will permanently replace all habits and logs.",
						async () => {
							this.plugin.data = this.imported;
							await this.plugin.savePluginData();
							this.plugin.refreshView();
							new Notice("Import complete.");
							this.close();
						},
					).open();
				}),
			);

		new Setting(contentEl)
			.setName("Merge")
			.setDesc("Add imported habits alongside existing ones, with duplicate resolution.")
			.addButton(btn =>
				btn.setButtonText("Merge").setCta().onClick(() => {
					this.close();
					this.openMergeFlow();
				}),
			);

		new Setting(contentEl).addButton(btn =>
			btn.setButtonText("Cancel").onClick(() => this.close()),
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private openMergeFlow(): void {
		const duplicates = detectDuplicates(this.plugin.data.habits, this.imported.habits);

		if (duplicates.length === 0) {
			this.applyMerge("ignore");
			return;
		}

		// Show duplicate resolution modal
		const modal = new DuplicateResolutionModal(
			this.plugin,
			duplicates.map(d => d.existing.name),
			strategy => this.applyMerge(strategy, duplicates),
		);
		modal.open();
	}

	private applyMerge(
		strategy: "replace" | "mergelogs" | "ignore",
		duplicates: ReturnType<typeof detectDuplicates> = [],
	): void {
		// Assign new UUIDs to non-duplicate imported habits
		const duplicateImportedIds = new Set(duplicates.map(d => d.imported.id));
		const idRemap = new Map<string, string>();

		for (const h of this.imported.habits) {
			if (!duplicateImportedIds.has(h.id)) {
				idRemap.set(h.id, crypto.randomUUID());
			}
		}

		// Build a remapped copy of the imported data
		const remapped: PluginData = {
			habits: this.imported.habits.map(h => {
				const newId = idRemap.get(h.id);
				return newId ? {...h, id: newId} : {...h};
			}),
			logs: {},
		};

		for (const h of this.imported.habits) {
			const newId = idRemap.get(h.id) ?? h.id;
			remapped.logs[newId] = [...(this.imported.logs[h.id] ?? [])];
		}

		// Rebuild duplicates array pointing at remapped imported habits (ids unchanged for dupes)
		const remappedDuplicates = duplicates.map(d => ({
			existing: d.existing,
			imported: remapped.habits.find(h => h.id === d.imported.id)!,
		}));

		const merged = mergeImport(this.plugin.data, remapped, remappedDuplicates, strategy);
		this.plugin.data = merged;
		this.plugin.savePluginData().then(() => {
			this.plugin.refreshView();
			new Notice("Import complete.");
		});
	}
}

class DuplicateResolutionModal extends Modal {
	private readonly duplicateNames: string[];
	private readonly onResolve: (strategy: "replace" | "mergelogs" | "ignore") => void;

	constructor(
		plugin: HabitTrackerPlugin,
		duplicateNames: string[],
		onResolve: (strategy: "replace" | "mergelogs" | "ignore") => void,
	) {
		super(plugin.app);
		this.duplicateNames = duplicateNames;
		this.onResolve = onResolve;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Resolve duplicate habits"});
		contentEl.createEl("p", {
			text: `The following habits already exist and were found in the import file:`,
		});

		const list = contentEl.createEl("ul");
		for (const name of this.duplicateNames) {
			list.createEl("li", {text: name});
		}

		contentEl.createEl("p", {text: "Choose how to handle all duplicates:"});

		new Setting(contentEl)
			.addButton(btn =>
				btn.setButtonText("Replace").setWarning().onClick(() => {
					this.onResolve("replace");
					this.close();
				}),
			)
			.addButton(btn =>
				btn.setButtonText("Merge logs").setCta().onClick(() => {
					this.onResolve("mergelogs");
					this.close();
				}),
			)
			.addButton(btn =>
				btn.setButtonText("Ignore").onClick(() => {
					this.onResolve("ignore");
					this.close();
				}),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
