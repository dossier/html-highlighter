module.exports = function(grunt) {
  var browsers = [{
    browserName: "chrome",
    platform: "linux"
  }];

  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: "",
          port: 9999
        }
      }
    },
    "saucelabs-mocha": {
      all: {
        options: {
          urls: ["http://127.0.0.1:9999/test/index.html"],
          tunnelTimeout: 5,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 3,
          browsers: browsers,
          testname: "html-highlighter",
          tags: ["master"]
        }
      }
    },
    watch: {}
  });


  /* Dependency loading */
  for(var key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0)
      grunt.loadNpmTasks(key);
  }

  grunt.registerTask("dev", ["connect", "watch"]);
  grunt.registerTask("test", ["connect", "saucelabs-mocha"]);
};