/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./index.tsx",
    ],
    theme: {
        extend: {
            colors: {
                school: {
                    primary: '#004a99',
                    secondary: '#001a35',
                    background: '#001a35',
                }
            }
        },
    },
    plugins: [],
}
