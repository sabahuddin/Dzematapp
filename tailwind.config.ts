import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "var(--radius-xs)",
        'design-sm': "var(--radius-sm)",
        'design-md': "var(--radius-md)",
        'design-lg': "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width-default)",
        focus: "var(--border-width-focus)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        surface: {
          base: "var(--surface-base)",
          field: "var(--surface-field)",
          subtle: "var(--surface-subtle)",
          card: "var(--surface-card)",
          'table-header': "var(--surface-table-header)",
          'gray-50': "var(--surface-gray-50)",
          'gray-96': "var(--surface-gray-96)",
        },
        semantic: {
          success: {
            bg: "var(--semantic-success-bg)",
            text: "var(--semantic-success-text)",
            border: "var(--semantic-success-border)",
          },
          info: {
            bg: "var(--semantic-info-bg)",
            text: "var(--semantic-info-text)",
            border: "var(--semantic-info-border)",
          },
          celebration: {
            bg: "var(--semantic-celebration-bg)",
            text: "var(--semantic-celebration-text)",
            border: "var(--semantic-celebration-border)",
          },
          award: {
            bg: "var(--semantic-award-bg)",
            text: "var(--semantic-award-text)",
            border: "var(--semantic-award-border)",
          },
        },
        'border-default': "var(--border-color-default)",
        'border-hover': "var(--border-color-hover)",
        'border-focus': "var(--border-color-focus)",
        bubble: {
          self: {
            bg: "var(--bubble-self-bg)",
            text: "var(--bubble-self-text)",
          },
          other: {
            bg: "var(--bubble-other-bg)",
            text: "var(--bubble-other-text)",
            border: "var(--bubble-other-border)",
          },
        },
        state: {
          'hover-bg': "var(--state-hover-bg)",
          'focus-ring': "var(--state-focus-ring)",
          'disabled-bg': "var(--state-disabled-bg)",
          'disabled-text': "var(--state-disabled-text)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
