Instructions
============
(assumes CWD is anywhere within the repository subtree)

1) Create free (Open Source) account with Sauce Labs

1.1) `$ export SAUCE_USERNAME=<your_username>`

1.2) `$ export SAUCE_ACCESS_KEY=<your_access_key>`

1.3) The access key above can be found on your account page in the
bottom left corner.

2) `$ npm install  # to set up dependencies`

2.1) Note: step above is only needed for development purposes.

3) To run tests locally:

3.1) `$ grunt dev`

3.2) Point browser to `http://localhost:9999/test´ and watch tests run

4) To run tests on Sauce Labs:

4.1) `$ grunt test  # requires a bit of patience`

Of note, because Sauce Labs employs tunnelling, it is possible to run
the test on Sauce Labs' hardware but using local assets (such as a
locally running  dossier.models server instance)

4.2) Once test concludes, access your Sauce Labs account and view test
details.

5) Integration with Travis

5.1) Install Travis Ruby gem tool

5.1.1) `# gem install travis`

5.1.2) `# gem install travis-lint  # optional`

5.2) Add Sauce Labs account details as env vars

5.2.1) `$ travis encrypt SAUCE_USERNAME=<user_username> --add env.global`

5.2.2) `$ travis encrypt SAUCE_ACCESS_KEY=<your_access_key> --add env.global`

5.2.3) `.travis.yml´ will have been modified now: don't push changes yet.

5.3) Set up your Travis account (link with Github, activate your
repository, ensure build starts only when `.travis.yml´ exists)

5.4) Push.  You should now get something like the following as soon as
the build concludes:

http://www.zimagez.com/zimage/screenshot-130315-100524.php
http://www.zimagez.com/zimage/screenshot-130315-100558.php (tests are
failing at the moment)

Since tests are failing, you should have received an email from Travis
informing you of the fact. (don't know if it sends out emails on
successful builds; would imagine not -- first time using CI of any kind)

Over on Sauce Labs, the test can be viewed in more detail:
http://www.zimagez.com/zimage/screenshot-130315-100747.php
