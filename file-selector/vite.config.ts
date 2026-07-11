import { defineConfig } from "vite-plus";

export default defineConfig({
    pack: {
        dts: {
            tsgo: true,
        },
        exports: true,
        sourcemap: true,
    },
    test: {
        environment: "jsdom",
    },
    lint: {
        options: {
            typeAware: true,
            typeCheck: true,
        },
    },
    fmt: {},
});
