import formsPlugin from '@tailwindcss/forms'
import typographyPlugin from '@tailwindcss/typography'

import type { Config } from 'tailwindcss'

export default {
    content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                display: 'Righteous',
                sans: 'Quicksand',
                mono: '"Courier Prime"'
            }
        },
    },
    darkMode: 'selector',
    plugins: [formsPlugin, typographyPlugin],
} satisfies Config;
