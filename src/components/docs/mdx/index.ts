// Components available in every docs page without an import. Tabs and
// TabItem keep Docusaurus's names; Callout is the blog's, which also takes
// the docs' admonition types.
import Callout from '../../blog/mdx/Callout.astro';
import Img from '../../blog/mdx/Img.astro';
import Table from '../../blog/mdx/Table.astro';
import Card from './Card.astro';
import Cards from './Cards.astro';
import CoinTable from './CoinTable.astro';
import DexComparison from './DexComparison.astro';
import Feature from './Feature.astro';
import Features from './Features.astro';
import Panel from './Panel.astro';
import TabItem from './TabItem.astro';
import Tabs from './Tabs.astro';

export const docComponents = {
  Callout,
  Card,
  Cards,
  CoinTable,
  DexComparison,
  Feature,
  Features,
  Img,
  Panel,
  TabItem,
  Tabs,
  table: Table,
};
