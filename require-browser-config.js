/*
 * RequireJS configuration for browser environments.
 */
requirejs.config({
    baseUrl: "./lib",
    paths: {
        "jscc/io/io": "jscc/io/ioBrowser",
        "jscc/log/log": "jscc/log/logBrowser"
    },
    config: {
        "jscc/global": {
            "version": "0.38.0",
            "defaultDriver": "./src/driver/parser.js"
        }
    }
});