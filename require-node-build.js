({
  "mainConfigFile": "./require-node-config.js",
  "optimize": "closure",
  "preserveLicenseComments": false,
  "generateSourceMaps": true,
  "closure": {
    "CompilerOptions": {
      "language": com.google.javascript.jscomp.CompilerOptions.LanguageMode.ECMASCRIPT5
    },
    "CompilationLevel": "ADVANCED_OPTIMIZATIONS",
    "loggingLevel": "FINE",
    "externExportsPath": "./externs.js"
  },
  "name": "jscc",
  "out": "./jscc-node.js",
  "logLevel": 2
})