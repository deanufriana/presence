---
trigger: always_on
description: Rules for UI Construction and Component Creation
---

# UI Construction & Component Creation

When creating new components, features, or pages in this project, you **MUST** follow these core principles to ensure consistency, accessibility, and maintainability.

## Mandatory Tooling

1.  **Always use shadcn-vue.** Every new component, feature, or page MUST be built using shadcn-vue components and patterns.
2.  **No custom HTML/CSS for standard UI.** Do not write raw HTML or custom CSS for elements that exist in the shadcn-vue registry (e.g., Buttons, Cards, Inputs, Dialogs).
3.  **Radix Vue & Tailwind CSS.** Leverage Radix Vue primitives (via shadcn-vue) for accessible UI behavior and Tailwind CSS v4 for layout and minor adjustments.

## Core Principles

### 1. Search Before Build

Before creating a custom UI element, always check the existing shadcn-vue components or community registries. Use `npx shadcn-vue@latest search` to find available items.

### 2. Compose, Don't Reinvent

Build complex interfaces by composing existing shadcn-vue primitives. For example:

- A **Settings Page** should be composed of `Tabs`, `Card`, and standard `Form` controls.
- A **Dashboard** should be composed of `Sidebar`, `Card`, `Chart`, and `Table`.

### 3. Consistency Over Customization

- Use built-in component **variants** (`variant="outline"`, `size="sm"`) before adding custom classes.
- Use **semantic colors** (`bg-primary`, `text-muted-foreground`) instead of raw Tailwind colors or hex codes.
- Follow the spacing and layout patterns defined in the [shadcn-vue skill rules](.agents/skills/shadcn-vue/SKILL.md).

## Verification

Any new UI should be audited against the `shadcn_vue:get_audit_checklist` to ensure it meets the project's quality and accessibility standards.
