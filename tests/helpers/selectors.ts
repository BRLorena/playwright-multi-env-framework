/**
 * Environment-aware selector map.
 *
 * This is the KEY abstraction for handling multi-environment UI differences.
 * Each environment has different DOM structures, selectors, and interaction patterns.
 *
 * STABLE:  id-based selectors, simple <ul>/<li> list, inline editing
 * RELEASE: class-based selectors, card layout, modal editing
 * INT:     data-testid selectors, dark theme, modal editing, filter toolbar
 */

export type EnvName = "stable" | "release" | "int";

export type EditMode = "inline" | "modal";

export interface EnvSelectors {
  // Form
  addForm: string;
  todoInput: string;
  addButton: string;

  // List container
  listContainer: string;

  // Todo item
  todoItem: string; // generic item selector
  todoItemByText: (text: string) => string;
  todoCheckbox: string;
  todoText: string;
  editButton: string;
  deleteButton: string;

  // Edit mode
  editMode: EditMode;

  // Inline edit (stable only)
  inlineEditInput?: string;

  // Modal edit (release + int)
  modalOverlay?: string;
  modalInput?: string;
  modalSave?: string;
  modalCancel?: string;

  // Empty state
  emptyState: string;

  // INT-only features
  filterAll?: string;
  filterActive?: string;
  filterCompleted?: string;
  todoCounter?: string;
}

const selectorMap: Record<EnvName, EnvSelectors> = {
  stable: {
    addForm: "#add-todo-form",
    todoInput: "#todo-input",
    addButton: "#add-todo",
    listContainer: "#todo-list",
    todoItem: "#todo-list li",
    todoItemByText: (text: string) =>
      `#todo-list li:has(span.todo-text:text("${text}"))`,
    todoCheckbox: ".toggle-checkbox",
    todoText: ".todo-text",
    editButton: ".edit-btn",
    deleteButton: ".delete-btn",
    editMode: "inline",
    inlineEditInput: ".inline-edit",
    emptyState: "#empty-msg",
  },

  release: {
    addForm: ".add-todo-form",
    todoInput: ".new-todo-input",
    addButton: ".add-card",
    listContainer: "#todo-cards",
    todoItem: ".todo-card",
    todoItemByText: (text: string) =>
      `.todo-card:has(.card-title:text("${text}"))`,
    todoCheckbox: ".card-checkbox",
    todoText: ".card-title",
    editButton: ".edit-icon",
    deleteButton: ".delete-icon",
    editMode: "modal",
    modalOverlay: "#edit-modal",
    modalInput: "#modal-edit-input",
    modalSave: "#modal-save",
    modalCancel: "#modal-cancel",
    emptyState: "#empty-msg",
  },

  int: {
    addForm: '[data-testid="add-todo-form"]',
    todoInput: '[data-testid="todo-input"]',
    addButton: '[data-testid="add-todo"]',
    listContainer: '[data-testid="todo-list"]',
    todoItem: ".todo-item",
    todoItemByText: (text: string) =>
      `.todo-item:has(.item-text:text("${text}"))`,
    todoCheckbox: 'input[type="checkbox"]',
    todoText: ".item-text",
    editButton: ".action-edit",
    deleteButton: ".action-delete",
    editMode: "modal",
    modalOverlay: '[data-testid="edit-modal"]',
    modalInput: '[data-testid="modal-edit-input"]',
    modalSave: '[data-testid="modal-save"]',
    modalCancel: '[data-testid="modal-cancel"]',
    emptyState: '[data-testid="empty-state"]',
    filterAll: '[data-testid="filter-all"]',
    filterActive: '[data-testid="filter-active"]',
    filterCompleted: '[data-testid="filter-completed"]',
    todoCounter: '[data-testid="todo-counter"]',
  },
};

export function getSelectors(env: EnvName): EnvSelectors {
  const selectors = selectorMap[env];
  if (!selectors) {
    throw new Error(`Unknown environment: ${env}. Valid: stable, release, int`);
  }
  return selectors;
}
