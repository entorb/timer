// selected item of a named list, first one if the selected was deleted
export const pickById = <T extends { id: string }>(items: T[], id: string): T | undefined =>
  items.find((i) => i.id === id) ?? items[0]
