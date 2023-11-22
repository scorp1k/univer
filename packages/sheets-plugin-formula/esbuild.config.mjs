import esbuild from 'esbuild';

// eslint-disable-next-line import/no-relative-packages
import baseConfig, { postBuild } from '../../esbuild.config.mjs';

['cjs', 'esm'].forEach(async (format) => {
    await esbuild.build({
        ...baseConfig,
        globalName: 'UniverPluginFormula',
        entryPoints: {
            index: './src/index.ts',
        },
        outdir: `./lib/${format}`,
        format,
    });

    await postBuild(format);
});