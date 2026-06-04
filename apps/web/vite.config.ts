import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type UserConfig } from "vite";

const config = defineConfig(({ command }) => {
	const isBuild = command === "build";
	const productionTslibFix = isBuild
		? ({
				resolve: {
					alias: {
						tslib: "tslib/tslib.es6.mjs",
					},
				},
				nitro: {
					traceDeps: ["tslib*"],
				},
			} satisfies {
				nitro: { traceDeps: string[] };
				resolve: NonNullable<UserConfig["resolve"]>;
			})
		: null;

	return {
		server: {
			port: 3000,
			allowedHosts: ["mantis-magical-swift.ngrok-free.app"],
		},
		resolve: {
			...productionTslibFix?.resolve,
			tsconfigPaths: true,
		},
		plugins: [
			devtools(),
			tailwindcss(),
			tanstackStart(),
			nitro({
				rollupConfig: { external: [/^@sentry\//] },
				...productionTslibFix?.nitro,
				runtimeConfig: {
					public: {
						posthogKey: process.env.VITE_PUBLIC_POSTHOG_KEY,
						posthogHost: process.env.VITE_PUBLIC_POSTHOG_HOST,
					},
				},
			}),
			viteReact(),
			babel({ presets: [reactCompilerPreset()] }),
		],
	};
});

export default config;
