import {Habit, PluginData} from "./types"

export function addHabit(data: PluginData, name: string, color?: string): Habit {
	const habit: Habit = {
		id: crypto.randomUUID(),
		name,
		createdAt: new Date().toISOString().split('T')[0] ?? '',
		...(color !== undefined ? { color } : {}),
	};
	data.habits.push(habit)
	data.logs[habit.id] = [];
	return habit;
}

export function deleteHabit(data: PluginData, id: string): void {
    // Replace Habits array with a new array without the deleted habit
	data.habits = data.habits.filter(h => h.id !== id);
    // Don't forget to remove its logs too
	delete data.logs[id];
}

export function toggleHabitDate(data: PluginData, id: string, date: string): void {
    // Catch if there's a missing log entry (initialize empty array if missing)
	if (!data.logs[id]) {
		data.logs[id] = [];
	}

    // Add or remove (toggle) date from log
	const index = data.logs[id].indexOf(date);
	if (index === -1) {
		data.logs[id].push(date);
	} else {
		data.logs[id].splice(index, 1);
	}
}

export function getCompletedDates(data: PluginData, id: string): string[] {
    // Catch if a log entry doesn't exist
    if (!data.logs[id]) {
		return [];
	}
    return data.logs[id];
}