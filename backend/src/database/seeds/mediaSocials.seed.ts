import { MediaSocial } from '../../mediaSocials/mediaSocial.type';

export const mediaSocialsSeed: Omit<MediaSocial, 'id'>[] = [
  {
    name:      'Github',
    url:       'https://github.com/bwbayu',
    iconClass: 'devicon-github-original colored',
  },
  {
    name:      'LinkedIn',
    url:       'https://www.linkedin.com/in/bayu-wicaksono-6a4b722a2/',
    iconClass: 'devicon-linkedin-plain colored',
  },
  {
    name:      'X',
    url:       'https://x.com/snowRlaxVein',
    iconClass: 'devicon-twitter-original colored',
  },
];
