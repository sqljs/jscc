(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['gulp', 'gulp-shell', 'rest', 'rest/interceptor/mime', 'rest/interceptor/errorCode', 'path', 'fs',
                'http', 'https', 'url', 'unzip2', 'stream'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports =
            factory(require('gulp'), require('gulp-shell'), require('rest'), require('rest/interceptor/mime'),
                    require('rest/interceptor/errorCode'), require('path'), require('fs'), require('http'),
                    require('https'), require('url'), require('unzip2'), require('stream'));
    } else {
        root.gulpfile =
            factory(root.gulp, root.gulpShell, root.rest, root.mime, root.errorCode, root.path, root.fs, root.http,
                    root.https, root.url, root.unzip2, root.stream);
    }
}(this, function(gulp, shell, rest, mime, errorCode, path, fs, http, https, urlUtil, unzip, stream) {
    gulp.task('jsdoc', ['parse.js', 'regex.js'], function(cb) {
        var cmd = shell(['jsdoc -c ./conf.json']);
        var e = null;
        cmd.on('error', function(err) {
            e = err;
        });
        cmd.on('end', function() {
            if (e) {
                cb(e);
            } else {
                cb();
            }
        });
        gulp.src('')
            .pipe(cmd);
    });

    gulp.task('parse.js', function(cb) {
        var cmd = shell(['node ./src/_boot_node.js -o ./lib/jscc/parse.js -t ./src/driver/parser.js ./src/parse.par']);
        var e = null;
        cmd.on('error', function(err) {
            e = err;
        });
        cmd.on('end', function() {
            if (e) {
                cb(e);
            } else {
                cb();
            }
        });
        gulp.src('')
            .pipe(cmd);
    });
    gulp.task('regex.js', function(cb) {
        var cmd = shell(['node ./src/_boot_node.js -o ./lib/jscc/regex.js -t ./src/driver/parser.js ./src/regex.par']);
        var e = null;
        cmd.on('error', function(err) {
            e = err;
        });
        cmd.on('end', function() {
            if (e) {
                cb(e);
            } else {
                cb();
            }
        });
        gulp.src('')
            .pipe(cmd);
    });

    function downloadAndUnzip(filename, url, cb) {
        var destFile = path.join(process.cwd(), "jar", filename);
        var redirectCount = 0;
        var downloadCallback = function(err, stat) {
            var requestHeaders = {
                "Accept": "application/zip"
            };
            if (!err && stat.isFile()) {
                var compareDateTime = stat.birthtime;
                requestHeaders["If-Modified-Since"] = compareDateTime.toUTCString();
            }
            var parsedUrl = urlUtil.parse(url);
            var web = /^https:?$/i.test(parsedUrl.protocol) ? https : http;
            web.get({
                protocol: parsedUrl.protocol,
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path,
                headers: requestHeaders
            }, function(res) {
                switch (res.statusCode) {
                    case 304:
                        // Not Modified
                        cb();
                        break;
                    case 302:
                        // Moved
                        if (++redirectCount > 10) {
                            cb(new Error("Too many redirects"));
                        }
                        url = res.headers.location;
                        downloadCallback(err, stat);
                        break;
                    case 200:
                        // OK
                        var outStream = fs.createWriteStream(destFile, { defaultEncoding: "binary" });
                        res.on('end', function() {
                            outStream.end();
                            fs.createReadStream(destFile)
                                .pipe(unzip.Extract({
                                          path: path.join(process.cwd(), "jar",
                                                          filename.substr(0, filename.length - 4))
                                      }))
                                .on('close', function() {
                                        cb();
                                    });
                        });
                        res.on('data', function(data) {
                            outStream.write(data);
                        });
                        break;
                    default:
                        cb(new Error("Asset download from " + url + " returned HTTP status " + res.statusCode));
                        break;
                }
            });
        };
        fs.stat(destFile, downloadCallback);
    }

    gulp.task('get-rhino', function(cb) {
        var client = rest.wrap(mime, {
            mime: "application/json",
            accept: "application/vnd.github.v3+json;q=1.0, application/json;q=0.8"
        })
            .wrap(errorCode);
        client({
            path: "https://api.github.com/repos/mozilla/rhino/releases/latest",
            headers: { "User-Agent": "jscc" }
        }).then(function(response) {
            var data = response.entity;
            var url = "";
            var filename = "";
            for (var index = 0; index < data.assets.length; index++) {
                if (/\.zip$/i.test(data.assets[index].name) && !/source/i.test(data.assets[index].name)) {
                    url = data.assets[index].browser_download_url;
                    filename = data.assets[index].name;
                    break;
                }
            }
            if (url == "") {
                cb(new Error("No rhino zip file found in latest release on Github"));
            } else {
                downloadAndUnzip(filename, url, cb);
            }
        }, function(errorResponse) {
            cb(new Error("Request failed with HTTP status " + errorResponse.status.code));
        });
    });

    gulp.task('get-closure', function(cb) {
        downloadAndUnzip("closure-latest.zip", "http://dl.google.com/closure-compiler/compiler-latest.zip", cb);
    });

    gulp.task('requirejs-optimize', ['parse.js', 'regex.js', 'get-rhino', 'get-closure'], function(cb) {
        var closureJarPath = path.join(process.cwd(), "jar", "closure-latest", "compiler.jar");
        var newestRhinoZip = "";
        var newestRhinoZipDate = new Date(0);
        gulp.src("./jar/*rhino*.zip", { read: false })
            .pipe(new stream.Writable({
                      objectMode: true,
                      write: function(vinylFile, encoding, next) {
                          fs.stat(vinylFile.path, function(err, stats) {
                              if (!err && (stats.birthtime > newestRhinoZipDate)) {
                                  newestRhinoZip = vinylFile.path;
                                  newestRhinoZipDate = stats.birthtime;
                              }
                              next();
                          });
                      }
                  }))
            .on('finish', function() {
                    if (newestRhinoZip == "") {
                        cb(new Error("No Rhino zip files were found; something may be wrong with this gulpfile."));
                        return;
                    }
                    var rhinoJarPath = "";
                    gulp.src(path.join(process.cwd(), "jar", path.basename(newestRhinoZip, ".zip"), "**/js.jar"),
                        { read: false })
                        .pipe(new stream.Writable({
                                  objectMode: true,
                                  write: function(vinylFile, encoding, next) {
                                      rhinoJarPath = vinylFile.path;
                                      next();
                                  }
                              }))
                        .on('finish', function() {
                                if (rhinoJarPath == "") {
                                    cb(new Error("js.jar was not found in the Rhino directory '" +
                                                 path.join(process.cwd(), "jar",
                                                           path.basename(newestRhinoZip, ".zip")) + "'"));
                                    return;
                                }
                                var lastError = "";
                                var rjsCommand = 'java -classpath "' + rhinoJarPath + '"' + path.delimiter + '"' +
                                                 closureJarPath +
                                                 '" org.mozilla.javascript.tools.shell.Main -opt -1 "' +
                                                 path.join(process.cwd(), "node_modules", "requirejs", "bin", "r.js") +
                                                 '" ';
                                gulp.src('./require-*-build.js', { read: false })
                                    .pipe(shell(rjsCommand + " -o <%= file.path %>"))
                                    .on('error', function(err) {
                                            lastError = err;
                                        })
                                    .on('end', function() {
                                            if (lastError == "") {
                                                cb();
                                            } else {
                                                cb(new Error(lastError));
                                            }
                                        });
                            });
                });
    });

    gulp.task('default', ['jsdoc', 'requirejs-optimize']);
}));