import type { ImageMetadata } from 'astro';
import team from '../assets/authors/basicswap-bsx-emblem.png';
import cryptoguard from '../assets/authors/cryptoguard.png';
import cangrejo from '../assets/authors/cangrejo.jpg';

export interface Author {
  name: string;
  bio: string;
  avatar: ImageMetadata;
  /** The team posts as an organization; everyone else as a person. */
  organization?: boolean;
}

// Bios as they appear on the old blog.
const AUTHORS: Record<string, Author> = {
  'BasicSwap Team': {
    name: 'BasicSwap Team',
    bio: "The official team behind BasicSwap. We're a group of passionate contributors dedicated to making atomic swap technology ubiquitous by creating accessible, user-friendly solutions for everyone.",
    avatar: team,
    organization: true,
  },
  Cryptoguard: {
    name: 'Cryptoguard',
    bio: 'A passionate contributor to BasicSwap, dedicated to decentralization, privacy, and digital security.',
    avatar: cryptoguard,
  },
  Cangrejo: {
    name: 'Cangrejo',
    bio: 'A passionate contributor to BasicSwap, dedicated to decentralization, privacy, and digital security.',
    avatar: cangrejo,
  },
};

export const author = (name: string): Author =>
  AUTHORS[name] ?? { name, bio: 'A contributor to the BasicSwap blog.', avatar: team };
