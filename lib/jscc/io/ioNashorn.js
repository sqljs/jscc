/*
 * Universal module definition for Nashorn version of io module.
 */
(function(root, factory) {
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['require', '../global', '../log/log'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require);
    } else {
        root.jsccio = factory(function(mod) {
            return root["jscc" + mod.split("/").pop()];
        });
    }
}(this, function(/** reqParameter */ require) {
    //>>excludeStart("closure", pragmas.closure);
    var jscc = {};
    //>>excludeEnd("closure");
    var global = /** @type {jscc.global} */ (require("../global")),
        log = /** @type {jscc.log} */ (require("../log/log"));
    /**
     * @type {java.lang.System}
     */
    var System = /** @type {java.lang.System} */ (Java.type("java.lang.System"));
    /**
     * @type {function(new:java.io.File, string)}
     */
    var File = /** @type {function(new:java.io.File, string)} */ (Java.type("java.io.File"));
    /**
     * @type {function(new:java.io.FileReader, (java.io.File|string))}
     */
    var FileReader = /** @type {function(new:java.io.FileReader, (java.io.File|string))}} */ (Java.type(
        "java.io.FileReader"));
    /**
     * @type {function(new:java.io.InputStreamReader, java.io.InputStream)}
     */
    var InputStreamReader = /** @type {function(new:java.io.InputStreamReader, java.io.InputStream)} */ (Java.type(
        "java.io.InputStreamReader"));
    /**
     * @type {function(new:java.io.BufferedReader, (java.io.FileReader|java.io.InputStreamReader))}
     */
    var BufferedReader = /** @type {function(new:java.io.BufferedReader, (java.io.FileReader|java.io.InputStreamReader))} */ (Java.type(
        "java.io.BufferedReader"));
    /**
     * @type {function(new:java.io.FileWriter, string)}
     */
    var FileWriter = /** @type {function(new:java.io.FileWriter, string)} */ (Java.type("java.io.FileWriter"));
    /**
     * @type {function(new:java.io.BufferedWriter, java.io.FileWriter)}
     */
    var BufferedWriter = /** @type {function(new:java.io.BufferedWriter, java.io.FileWriter)} */ (Java.type(
        "java.io.BufferedWriter"));
    /**
     * @type {function(new:java.io.PrintWriter, (java.io.BufferedWriter|java.io.PrintStream|string))}
     */
    var PrintWriter = /** @type {function(new:java.io.PrintWriter, (java.io.BufferedWriter|java.io.PrintStream|string))} */ (Java.type(
        "java.io.PrintWriter"));
    /**
     * @type {function(new:java.lang.StringBuilder, string=)}
     */
    var StringBuilder = /** @type {function(new:java.lang.StringBuilder, string=)} */ (Java.type(
        "java.lang.StringBuilder"));

    /**
     * @constructor
     * @implements {jscc.io}
     */
    jscc.ioNashorn = function() {
    };

    /**
     * @param {number=} exitcode
     * @private
     */
    jscc.ioNashorn.prototype._quit = function(exitcode) {
        if (typeof exitcode !== 'number') {
            exitcode = 0;
        }
        exit(exitcode);
    };

    /**
     * @private
     * @param {string} file
     * @returns {string}
     */
    jscc.ioNashorn.prototype._read_file = function(file) {
        var builder = new StringBuilder();
        var diskFile = new File(file);
        if (diskFile.exists() && diskFile.isFile() && diskFile.canRead()) {
            var reader = new FileReader(diskFile);
            var buffer = new BufferedReader(reader);
            try {
                var line = buffer.readLine();
                while (line !== null && typeof line !== "undefined") {
                    builder.append(line);
                    builder.append(System.lineSeparator());
                    line = buffer.readLine();
                }
            } catch (ex) {
                log.fatal("unable to open file '" + file + "'");
                log.fatal("exception message was: '" + ex.message + "'");
                this._quit(1);
            } finally {
                buffer.close();
                reader.close();
            }
        } else {
            log.fatal("unable to open file '" + file + "'");
            this._quit(2);
        }
        return builder.toString();
    };

    /**
     * @param {string} file
     * @param {string} content
     * @returns {boolean}
     * @private
     */
    jscc.ioNashorn.prototype._write_file = function(file, content) {
        var fileWriter = new FileWriter(file);
        var buffer = new BufferedWriter(fileWriter);
        var writer = new PrintWriter(buffer);
        try {
            writer.write(content);
        } catch (ex) {
            log.error("unable to write '" + file + "'");
            log.error("exception message was: '" + ex.message + "'");
            return false;
        } finally {
            writer.close();
            buffer.close();
            fileWriter.close();
        }

        return true;
    };

    /**
     * @inheritDoc
     * @param {(string|function(string)|ioOptions)=} options
     * @returns {(string|undefined)}
     */
    jscc.ioNashorn.prototype.read_all_input = function(options) {
        var filename = "";
        var async = false;
        /**
         * @param {string} text
         */
        var chunkCallback = function(text) {
        };
        var endCallback = function() {
        };

        if (options) {
            if (typeof options === "string") {
                filename = options;
            } else if (typeof options === "function") {
                chunkCallback = /** @type {function(string)} */ (options);
                async = true;
            } else if (typeof options === "object") {
                if (typeof options.filename === "string") {
                    filename = options.filename;
                }
                if (typeof options.chunkCallback === "function") {
                    chunkCallback = options.chunkCallback;
                    async = true;
                }
                if (typeof options.endCallback === "function") {
                    endCallback = options.endCallback;
                    async = true;
                }
            }
        }

        if (filename != "" && !async) {
            return this._read_file(filename);
        }

        if (filename == "" && !async) {
            var builder = new StringBuilder();
            var stdIn = System.in;
            var buffer = new BufferedReader(new InputStreamReader(stdIn));
            try {
                var line = buffer.readLine();
                while (line) {
                    builder.append(line);
                    builder.append(System.lineSeparator());
                    line = buffer.readLine();
                }
            } finally {
                buffer.close();
            }
            return builder.toString();
        }

        var asyncInput = filename == "" ?
            new InputStreamReader(System.in) :
            new FileReader(filename);
        var buffer = new BufferedReader(asyncInput);
        try {
            buffer.lines().forEachOrdered(chunkCallback);
            endCallback();
        } finally {
            buffer.close();
        }
    };

    /**
     * @inheritDoc
     * @param {(string|function(string)|ioOptions)=} options
     * @returns {(string|undefined)}
     */
    jscc.ioNashorn.prototype.read_template = function(options) {
        var filename = global.DEFAULT_DRIVER;
        var async = false;
        /**
         * @param {string} text
         */
        var chunkCallback = function(text) {
        };
        var endCallback = function() {
        };

        if (options) {
            if (typeof options === "string") {
                filename = options;
            } else if (typeof options === "function") {
                chunkCallback = /** @type {function(string)} */ (options);
            } else if (typeof options === "object") {
                if (typeof options.filename === "string") {
                    filename = options.filename;
                }
                if (typeof options.chunkCallback === "function") {
                    chunkCallback = options.chunkCallback;
                    async = true;
                }
                if (typeof options.endCallback === "function") {
                    endCallback = options.endCallback;
                }
            }
        }

        if (!async) {
            return this._read_file(filename);
        }

        var asyncInput = new FileReader(filename);
        var buffer = new BufferedReader(asyncInput);
        try {
            buffer.lines().forEachOrdered(chunkCallback);
            endCallback();
        } finally {
            buffer.close();
        }
    };

    /**
     * @inheritDoc
     * @param {(string|ioWriteOutputOptions)} options
     */
    jscc.ioNashorn.prototype.write_output = function(options) {
        var text = "";
        var destination = "";
        var async = false;
        var callback = function() {
        };

        if (options && typeof options === 'string') {
            text = options;
        } else if (options && typeof options === 'object') {
            if (typeof options.text === 'string') {
                text = options.text;
            }
            if (typeof options.destination === 'string') {
                destination = options.destination;
            }
            if (typeof options.callback === 'function') {
                callback = options.callback;
                async = true;
            }
        }

        if (destination != "" && !async) {
            this._write_file(destination, text);
        } else if (destination == "" && !async) {
            System.out.print(text);
        } else {
            var asyncOutput = destination == "" ?
                new PrintWriter(System.out) :
                new PrintWriter(destination);
            try {
                asyncOutput.print(text);
                callback();
            } finally {
                asyncOutput.close();
            }
        }
    };

    /**
     * @inheritDoc
     * @param {string} text
     */
    jscc.ioNashorn.prototype.write_debug = function(text) {
        System.out.print(text);
    };

    /**
     * @inheritDoc
     * @param {number=} exitCode
     */
    jscc.ioNashorn.prototype.exit = function(exitCode) {
        if (typeof exitCode !== "number") {
            exitCode = 0;
        }
        System.exit(exitCode);
    };

    /**
     * @module jscc/io/io
     */
    return new jscc.ioNashorn();
}));
