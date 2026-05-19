import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	server: {
		port: 3000,
		allowedHosts: ["mantis-magical-swift.ngrok-free.app"],
	},
	resolve: {
		alias: {
			tslib: "tslib/tslib.es6.mjs",
		},
		tsconfigPaths: true,
	},
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		nitro({
			rollupConfig: { external: [/^@sentry\//] },
			traceDeps: ["tslib*"],
		}),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
});

export default config;
