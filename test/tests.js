// Load json data files.
/* eslint-disable global-require, max-len */
const dataFiles = [
  'viber_attacked_by_syrian_electronic_army-cropped',
  'one_paragraph-ampersand_nonexistent',
  'one_paragraph-ampersand',
  'one_paragraph-ampersand_escaped',
  'viber_attacked_by_syrian_electronic_army',
];
const data = dataFiles.map(d => require(`../etc/data/${d}.json`).html);
/* eslint-enable global-require */

// Constants
const counts = {
  the: 46,
  viber: 22,
  a: 285,
  overlapping: 3,
};

// Tests available
const tests = {
  standard: {
    text:
      'Viber has now clarified that the hack only allowed access to two' +
      ' minor systems, a customer support panel and a support' +
      ' administration system. According to the company’s official' +
      ' response, “no sensitive user data was exposed and Viber’s databases' +
      ' were not ‘hacked’.”',
    xpath: {
      start: { offset: 0, xpath: '/p[3]/a/text()[1]' },
      end: { offset: 260, xpath: '/p[3]/text()[1]' },
    },
  },
  wrapElement: {
    text: 'the Viber support page, though',
    xpath: {
      start: { xpath: '/p[2]/text()[1]', offset: 47 },
      end: { xpath: '/p[2]/text()[2]:8', offset: 8 },
    },
  },
  multiElement: {
    text:
      'dashboard, not a database. Viber also took the opportunity to' +
      ' respond to accusations of spying:Viber, like many other companies' +
      ' such as Microsoft, Cisco, Google, and Intel maintains a development' +
      ' center in Israel. It seems like this caused some people to come up' +
      ' with some pretty bizarre conspiracy theories.It goes without' +
      ' saying, that these claims are completely without merit, and have no' +
      ' basis in reality whatsoever.Viber is a free messaging and calling' +
      ' service based out of London, with development centers in Israel,' +
      ' with over 200 million users globally.Update — Viber has followed up' +
      ' with more details',
    xpath: {
      start: { xpath: '/p[10]/text()[1]', offset: 337 },
      end: { xpath: '/p[13]/strong/text()[1]:', offset: 48 },
    },
  },
  bottomup: {
    text: ' support page, though it',
    xpath: {
      start: { xpath: '/p[2]/a[2]/text()', offset: 5 },
      end: { xpath: '/p[2]/text()[2]', offset: 11 },
    },
  },
  uppercase: {
    text: 'Spot originally',
    xpath: {
      start: { xpath: '/p[2]/a/text()[1]', offset: 5 },
      end: { xpath: '/p[2]/text()[1]', offset: 11 },
    },
  },
  'wampersand-&': {
    text:
      'Army (a pro-government group of computer hackers aligned with' +
      ' Syrian President Bashar al-Assad) & the world cried foul',
    xpath: {
      start: { xpath: '/p[1]/code[1]/text()[1]', offset: 18 },
      end: { xpath: '/p[1]/text()[4]', offset: 114 },
    },
  },
  'sampersand-&': {
    text: '& the world cried foul',
    xpath: {
      start: { xpath: '/p[1]/text()[4]', offset: 92 },
      end: { xpath: '/p[1]/text()[4]', offset: 114 },
    },
  },
  'eampersand-&': {
    text:
      'Army (a pro-government group of computer hackers aligned with' +
      ' Syrian President Bashar al-Assad) &',
    xpath: {
      start: { xpath: '/p[1]/code[1]/text()[1]', offset: 18 },
      end: { xpath: '/p[1]/text()[4]', offset: 93 },
    },
  },
  'wampersand-n': {
    text:
      'Army (a pro-government group of computer hackers aligned with' +
      ' Syrian President Bashar al-Assad) n the world cried foul',
    xpath: {
      start: { xpath: '/p[1]/code[1]/text()[1]', offset: 18 },
      end: { xpath: '/p[1]/text()[4]', offset: 114 },
    },
  },
  'sampersand-n': {
    text: 'n the world cried foul',
    xpath: {
      start: { xpath: '/p[1]/text()[4]', offset: 92 },
      end: { xpath: '/p[1]/text()[4]', offset: 114 },
    },
  },
  'eampersand-n': {
    text:
      'Army (a pro-government group of computer hackers aligned with' +
      ' Syrian President Bashar al-Assad) n',
    xpath: {
      start: { xpath: '/p[1]/code[1]/text()[1]', offset: 18 },
      end: { xpath: '/p[1]/text()[4]', offset: 93 },
    },
  },
  'full.wrapElement': {
    text:
      'Viber appeared to have been hacked by the Syrian Electronic Army (a pro-government group',
    xpath: {
      start: {
        xpath:
          '/html[1]/body[1]/div[2]/article[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/p[1]/text()[1]',
        offset: 62,
      },
      end: {
        xpath:
          '/html[1]/body[1]/div[2]/article[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/p[1]/text()[2]',
        offset: 24,
      },
    },
  },
  overlapping: {
    queries: [
      {
        start: { xpath: '/p[3]/text()[1]', offset: 19 },
        end: { xpath: '/p[3]/text()[1]', offset: 52 },
      },
      {
        start: { xpath: '/p[3]/text()[1]', offset: 38 },
        end: { xpath: '/p[3]/text()[1]', offset: 73 },
      },
      {
        start: { xpath: '/p[3]/text()[1]', offset: 1 },
        end: { xpath: '/p[3]/text()[1]', offset: 23 },
      },
    ],
  },
};

export { data, counts, tests };
