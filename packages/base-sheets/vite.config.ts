import { defineConfig } from 'vite';
import path from 'path';
import preact from '@preact/preset-vite';
import { name, version } from './package.json';
import createExternal from 'vite-plugin-external';

const resolve = (url: string) => path.resolve(__dirname, url);

export default defineConfig({
    build: {
        lib: {
            entry: resolve('src/index.ts'),
            name: 'UniverBaseSheets',
            formats: ['es', 'umd', 'cjs'],
            fileName: 'univer-base-sheets',
        },
        outDir: './lib',
        sourcemap: true,
    },
    define: {
        pkgJson: { name, version },
    },
    css: {
        modules: {
            localsConvention: 'camelCaseOnly', // dash to camelCase conversion// .apply-color -> applyColor
            generateScopedName: 'univer-[local]', // custom prefix class name
        },
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
    // resolve: {
    //     alias: [
    //         {
    //             find: '@',
    //             replacement: path.resolve(__dirname, './node_modules')
    //         }
    //     ],
    // },
    server: {
        port: 3103,
        open: true, // Automatically open the app in the browser on server start.
        hmr: true,
    },
    plugins: [
        preact(),
        createExternal({
            externals: {
                '@univer/core': '@univer/core',
                '@univer/base-render': '@univer/base-render',
                '@univer/base-component': '@univer/base-component',
                '@univer/style-univer': '@univer/style-univer',
                'css-vars-ponyfill': 'css-vars-ponyfill',
                nanoid: 'nanoid',
                preact: 'preact',
                react: 'react',
            },
        }),
    ],
    resolve: {
        // preserveSymlinks: true,
        // alias: [
        //     {
        //         find: '@Basics',
        //         replacement: path.resolve('..', '/src/Basics'),
        //     },
        // ],
        // alias: [
        //     {
        //         find: /^@([^univer].*)$/,
        //         replacement: path.resolve(__dirname, './src/$1'),
        //     },
        // ],
    },
});
