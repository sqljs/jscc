({
    "mainConfigFile": "./require-nashorn-config.js",
    "baseUrl": ".",
    "pragmas": {
        "closure": true,
        "nashorn": true
    },
    "has": {
        "node": false
    },
    "optimize": "closure",
    "preserveLicenseComments": false,
    "generateSourceMaps": true,
    "closure": {
        "CompilerOptions": {
            "language": com.google.javascript.jscomp.CompilerOptions.LanguageMode.ECMASCRIPT5,
            "checkSymbols": true,
            "checkTypes": true
        },
        "CompilationLevel": "ADVANCED_OPTIMIZATIONS",
        "loggingLevel": "FINE",
        "externExportsPath": "./externs.js"
    },
    "name": "bin/almond",
    "include": ["main"],
    "stubModules": ["text"],
    "wrap": {
        "startFile": ["fileoverview.js", "typedef.js", "global-backfills.js", "lib/jscc/io/io.js", "lib/jscc/log/log.js", "lib/jscc/bitset/bitset.js"],
        "endFile": ["exports.js", "exports-require.js", "require-nashorn-config.js", "require-main.js"]
    },
    "out": "./bin/jscc-nashorn.js",
    "logLevel": 2
})