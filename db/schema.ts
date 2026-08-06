import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    monogram: text("monogram").notNull(),
    description: text("description").notNull(),
    href: text("href"),
    appHref: text("app_href"),
    code: text("code"),
    actionLabel: text("action_label").notNull(),
    accent: text("accent").notNull(),
    tipsJson: text("tips_json").notNull().default("[]"),
    notice: text("notice").notNull().default(""),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    lastVerifiedAt: text("last_verified_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("entries_category_enabled_sort_idx").on(table.category, table.enabled, table.sortOrder),
    index("entries_last_verified_at_idx").on(table.lastVerifiedAt),
  ],
);
