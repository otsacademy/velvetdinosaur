export type MetricUnit = 'bytes' | 'percent' | 'ms' | 's' | 'ops' | 'count' | 'ratio';

export type SeriesQuery = {
  query: string;
  name?: string;
  nameFromLabel?: string;
};

export type ChartDef = {
  id: string;
  title: string;
  unit?: MetricUnit;
  series: SeriesQuery[];
  description?: string;
};

export type StatDef = {
  id: string;
  label: string;
  unit?: MetricUnit;
  query: string;
};

export type DashboardDef = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  stats: StatDef[];
  charts: ChartDef[];
};

export type DashboardMeta = Pick<DashboardDef, 'slug' | 'title' | 'description' | 'tags'>;
