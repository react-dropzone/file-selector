module.exports = {
    testEnvironment: "jsdom",
    globals: {
        'ts-jest': {
            tsconfig: './tsconfig.spec.json',
            diagnostics: true
        }
    },
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    coveragePathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/node_modules/',
        '<rootDir>/out-tsc/',
        '<rootDir>/test/'
    ],
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'node'
    ]
};
