import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        ai: "border border-violet-500/20 bg-transparent text-violet-600 hover:bg-violet-500/5 hover:text-violet-700 dark:text-violet-400",
        orange: "border border-orange-500/20 bg-transparent text-orange-600 hover:bg-orange-500/5 dark:text-orange-400",
        emerald: "border border-emerald-500/20 bg-transparent text-emerald-600 hover:bg-emerald-500/5 dark:text-emerald-400",
        excel: "border border-emerald-500/20 bg-transparent text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:text-emerald-400 dark:hover:text-emerald-300",
        gradient: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-violet-500/20",
      },
      size: {
        "default": "h-10 px-4 py-2",
        "sm": "h-9 rounded-md px-3",
        "lg": "h-11 rounded-md px-8",
        "icon": "h-10 w-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
        "xs": "h-8 rounded-md px-3 text-xs gap-1.5",
        "xxs": "h-7 rounded-md px-2 text-[10px] gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
