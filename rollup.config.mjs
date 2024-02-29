import {createRequire} from 'node:module';
import camelCase from 'camelcase';
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const name = pkg.name;
const input = pkg.module;

const plugins = [
    nodeResolve(),
    commonjs(),
];

const output = {
    format: 'umd',
    name: camelCase(name),
    sourcemap: true
};

export default [{
    input,
    plugins,
    output: {
        ...output,
        file: distPath(`${name}.umd.js`)
    }
},
{
    input,
    plugins: [
        ...plugins,
        terser()
    ],
    output: {
        ...output,
        file: distPath(`${name}.umd.min.js`)
    }
}];

function distPath(file) {
    return `./dist/bundles/${file}`;
}
