// Components available in every post without an import, under the names
// the old blog used. Markdown tables render through Table too.
import Callout from './Callout.astro';
import ChartWrapper from './ChartWrapper.astro';
import Checklist from './Checklist.astro';
import Collapsible from './Collapsible.astro';
import Counter from './Counter.astro';
import CustomDiv from './CustomDiv.astro';
import Gallery from './Gallery.astro';
import Img from './Img.astro';
import SwapSteps from './SwapSteps.astro';
import Table from './Table.astro';
import Timeline from './Timeline.astro';
import UrlPreviewCard from './UrlPreviewCard.astro';
import YouTube from './YouTube.astro';

export const postComponents = {
  Callout,
  ChartWrapper,
  Checklist,
  Collapsible,
  Counter,
  CustomDiv,
  Gallery,
  Img,
  StyledTableWrapper: Table,
  SwapSteps,
  Timeline,
  UrlPreviewCard,
  YouTube,
  table: Table,
};
