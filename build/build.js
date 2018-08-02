const rollup = require('rollup')
const rollupBabel = require('rollup-plugin-babel')
const rollupMinify = require('rollup-plugin-babel-minify')
const rollupNode = require('rollup-plugin-node-resolve')
const rollupCommonJS = require('rollup-plugin-commonjs')

function inputOptionsGenerator (options) {
  options = options || {}
  const envPreset = Object.assign({ modules: false, loose: true }, options.envPreset || {})
  const inputOptions = {
    input: './src/persian-calendar.js',
    plugins: [
      rollupNode(),
      rollupCommonJS({
        include: 'node_modules/**'
      })
    ]
  }

  if (options.compile !== false || options.compile !== null) {
    rollupBabel({
      babelrc: false,
      presets: [['env', envPreset]],
      plugins: ['external-helpers']
    })
  }

  if (options.minify) {
    inputOptions.plugins.push(
      rollupMinify({
        comments: false,
        mangle: { topLevel: false }
      })
    )
  }

  return inputOptions
}

function outputOptionsGenerator (options) {
  defaults = {
    destination: 'node',
    filename: 'persian-calendar.js'
  }
  options = Object.assign(defaults, options || {})
  const outputOptions = {
    file: `build/Release/${options.destination}/${options.filename}`,
    format: 'cjs',
    sourcemap: true,
    name: 'persian-calendar'
  }

  delete options.destination
  delete options.filename

  return Object.assign(outputOptions, options)
}

async function babelAndRollup () {
  const nodeInputOptions = inputOptionsGenerator({ envPreset: { targets: ['node >= 6'] } })
  const nodeOutputOptions = outputOptionsGenerator()
  const nodeBundle = await rollup.rollup(nodeInputOptions)
  await nodeBundle.write(nodeOutputOptions)

  const browserInputOptions = inputOptionsGenerator()
  const browserOutputOptions = outputOptionsGenerator({ destination: 'browser' })
  const browserBundle = await rollup.rollup(browserInputOptions)
  await browserBundle.write(browserOutputOptions)
}

babelAndRollup().catch(console.error)
