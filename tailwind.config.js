/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调
        'bg-primary': '#0B0F19',
        'bg-secondary': '#151B2B',
        'bg-tertiary': '#1E293B',
        'accent': '#6366F1',
        'accent-hover': '#4F46E5',
        'accent-light': '#818CF8',
        // 功能色
        'success': '#10B981',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',
        // 文本色
        'text-primary': '#F9FAFB',
        'text-secondary': '#E5E7EB',
        'text-tertiary': '#9CA3AF',
        'text-disabled': '#6B7280',
        // 习惯颜色
        'habit-orange': '#F97316',
        'habit-yellow': '#F59E0B',
        'habit-green': '#10B981',
        'habit-blue': '#3B82F6',
        'habit-purple': '#8B5CF6',
        'habit-red': '#EF4444',
        'habit-gray': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
