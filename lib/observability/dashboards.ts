import type { DashboardDef, DashboardMeta } from '@/lib/observability/types';

export const TAG_GROUPS: Record<string, string[]> = {
  'Database-related': ['prometheus', 'mysql', 'percona', 'redis', 'mongodb'],
  'Web/System-related': ['nginx', 'nginx prometheus exporter', 'linux', 'system'],
  'Specific Utilities': ['blackbox', 'status', 'velvetdinosaur']
};

export const DASHBOARDS: DashboardDef[] = [
  {
    slug: 'mongodb',
    title: 'MongoDB',
    description: 'Connection health, storage growth, and operation throughput.',
    tags: ['prometheus', 'database', 'mongodb'],
    stats: [
      { id: 'mongodb-up', label: 'Up', query: 'max(up{job="mongodb"})', unit: 'count' },
      { id: 'mongodb-collections', label: 'Collections', query: 'mongodb_dbstats_collections{job="mongodb"}', unit: 'count' },
      { id: 'mongodb-objects', label: 'Objects', query: 'mongodb_dbstats_objects{job="mongodb"}', unit: 'count' }
    ],
    charts: [
      {
        id: 'mongodb-connections',
        title: 'Connections by State',
        unit: 'count',
        series: [
          {
            query: 'sum by (state) (mongodb_connections{job="mongodb"})',
            nameFromLabel: 'state'
          }
        ]
      },
      {
        id: 'mongodb-ops',
        title: 'Operations / sec',
        unit: 'ops',
        series: [
          {
            query: 'rate(mongodb_op_counters_total{job="mongodb"}[5m])',
            nameFromLabel: 'type'
          }
        ]
      },
      {
        id: 'mongodb-storage',
        title: 'Data vs Storage Size',
        unit: 'bytes',
        series: [
          { name: 'Data size', query: 'mongodb_dbstats_dataSize{job="mongodb"}' },
          { name: 'Storage size', query: 'mongodb_dbstats_storageSize{job="mongodb"}' }
        ]
      },
      {
        id: 'mongodb-index-size',
        title: 'Index Size',
        unit: 'bytes',
        series: [{ name: 'Index size', query: 'mongodb_dbstats_indexSize{job="mongodb"}' }]
      }
    ]
  },
  {
    slug: 'mysql',
    title: 'MySQL Overview',
    description: 'Connections, throughput, and buffer pool behavior.',
    tags: ['prometheus', 'mysql', 'percona', 'database'],
    stats: [
      { id: 'mysql-up', label: 'Up', query: 'max(up{job="mysql"})', unit: 'count' },
      { id: 'mysql-threads', label: 'Threads Connected', query: 'mysql_global_status_threads_connected{job="mysql"}', unit: 'count' },
      { id: 'mysql-slow', label: 'Slow Queries', query: 'mysql_global_status_slow_queries{job="mysql"}', unit: 'count' }
    ],
    charts: [
      {
        id: 'mysql-threads-connected',
        title: 'Threads Connected',
        unit: 'count',
        series: [{ name: 'Threads', query: 'mysql_global_status_threads_connected{job="mysql"}' }]
      },
      {
        id: 'mysql-queries',
        title: 'Queries / sec',
        unit: 'ops',
        series: [
          { name: 'Questions', query: 'rate(mysql_global_status_questions{job="mysql"}[5m])' }
        ]
      },
      {
        id: 'mysql-connections',
        title: 'Connections / sec',
        unit: 'ops',
        series: [
          { name: 'Connections', query: 'rate(mysql_global_status_connections{job="mysql"}[5m])' }
        ]
      },
      {
        id: 'mysql-buffer-pool',
        title: 'InnoDB Buffer Pool',
        unit: 'bytes',
        series: [
          { name: 'Data', query: 'mysql_global_status_innodb_buffer_pool_bytes_data{job="mysql"}' },
          { name: 'Dirty', query: 'mysql_global_status_innodb_buffer_pool_bytes_dirty{job="mysql"}' }
        ]
      }
    ]
  },
  {
    slug: 'nginx',
    title: 'NGINX Exporter',
    description: 'Traffic rate and active connection breakdown.',
    tags: ['nginx', 'nginx prometheus exporter', 'web'],
    stats: [
      { id: 'nginx-up', label: 'Up', query: 'max(nginx_up{job="nginx"})', unit: 'count' },
      { id: 'nginx-active', label: 'Active Connections', query: 'nginx_connections_active{job="nginx"}', unit: 'count' },
      { id: 'nginx-requests', label: 'Requests / sec', query: 'rate(nginx_http_requests_total{job="nginx"}[5m])', unit: 'ops' }
    ],
    charts: [
      {
        id: 'nginx-requests',
        title: 'HTTP Requests / sec',
        unit: 'ops',
        series: [
          { name: 'Requests', query: 'rate(nginx_http_requests_total{job="nginx"}[5m])' }
        ]
      },
      {
        id: 'nginx-connections',
        title: 'Active Connections',
        unit: 'count',
        series: [{ name: 'Active', query: 'nginx_connections_active{job="nginx"}' }]
      },
      {
        id: 'nginx-conn-states',
        title: 'Connection States',
        unit: 'count',
        series: [
          { name: 'Reading', query: 'nginx_connections_reading{job="nginx"}' },
          { name: 'Writing', query: 'nginx_connections_writing{job="nginx"}' },
          { name: 'Waiting', query: 'nginx_connections_waiting{job="nginx"}' }
        ]
      },
      {
        id: 'nginx-accepted',
        title: 'Accepted Connections / sec',
        unit: 'ops',
        series: [
          { name: 'Accepted', query: 'rate(nginx_connections_accepted{job="nginx"}[5m])' }
        ]
      }
    ]
  },
  {
    slug: 'node',
    title: 'Node Exporter Full',
    description: 'CPU, memory, disk, and network load.',
    tags: ['linux', 'system', 'prometheus'],
    stats: [
      {
        id: 'node-up',
        label: 'Node Up',
        query: 'max(up{job="node"})',
        unit: 'count'
      },
      {
        id: 'node-load1',
        label: 'Load (1m)',
        query: 'avg(node_load1{job="node"})',
        unit: 'count'
      },
      {
        id: 'node-memory-used',
        label: 'Memory Used',
        query: 'avg(node_memory_MemTotal_bytes{job="node"} - node_memory_MemAvailable_bytes{job="node"})',
        unit: 'bytes'
      }
    ],
    charts: [
      {
        id: 'node-cpu',
        title: 'CPU Usage',
        unit: 'percent',
        series: [
          {
            name: 'CPU %',
            query:
              '100 - (avg(rate(node_cpu_seconds_total{job="node",mode="idle"}[5m])) * 100)'
          }
        ]
      },
      {
        id: 'node-load',
        title: 'Load Average',
        unit: 'count',
        series: [
          { name: 'Load 1m', query: 'avg(node_load1{job="node"})' },
          { name: 'Load 5m', query: 'avg(node_load5{job="node"})' },
          { name: 'Load 15m', query: 'avg(node_load15{job="node"})' }
        ]
      },
      {
        id: 'node-memory',
        title: 'Memory Used',
        unit: 'bytes',
        series: [
          {
            name: 'Used',
            query:
              'avg(node_memory_MemTotal_bytes{job="node"} - node_memory_MemAvailable_bytes{job="node"})'
          }
        ]
      },
      {
        id: 'node-disk',
        title: 'Disk Used',
        unit: 'bytes',
        series: [
          {
            name: 'Disk used',
            query:
              'sum(node_filesystem_size_bytes{job="node",fstype!~"tmpfs|fuse.lxcfs|overlay"} - node_filesystem_avail_bytes{job="node",fstype!~"tmpfs|fuse.lxcfs|overlay"})'
          }
        ]
      },
      {
        id: 'node-network',
        title: 'Network Throughput',
        unit: 'bytes',
        series: [
          {
            name: 'RX',
            query: 'rate(node_network_receive_bytes_total{job="node",device!~"lo"}[5m])'
          },
          {
            name: 'TX',
            query: 'rate(node_network_transmit_bytes_total{job="node",device!~"lo"}[5m])'
          }
        ]
      }
    ]
  },
  {
    slug: 'prometheus',
    title: 'Prometheus 2.0 Overview',
    description: 'Ingestion, queries, and TSDB health.',
    tags: ['prometheus', 'system'],
    stats: [
      {
        id: 'prom-ready',
        label: 'Ready',
        query: 'max(prometheus_ready{job="prometheus"})',
        unit: 'count'
      },
      {
        id: 'prom-targets-up',
        label: 'Targets Up',
        query: 'sum(up)',
        unit: 'count'
      },
      {
        id: 'prom-targets-total',
        label: 'Targets Total',
        query: 'count(up)',
        unit: 'count'
      }
    ],
    charts: [
      {
        id: 'prom-samples',
        title: 'Samples Ingested / sec',
        unit: 'ops',
        series: [
          {
            name: 'Samples',
            query: 'rate(prometheus_tsdb_head_samples_appended_total{job="prometheus"}[5m])'
          }
        ]
      },
      {
        id: 'prom-series',
        title: 'Active Series',
        unit: 'count',
        series: [{ name: 'Series', query: 'prometheus_tsdb_head_series{job="prometheus"}' }]
      },
      {
        id: 'prom-http',
        title: 'HTTP Requests / sec',
        unit: 'ops',
        series: [
          { name: 'Requests', query: 'rate(prometheus_http_requests_total{job="prometheus"}[5m])' }
        ]
      },
      {
        id: 'prom-query-latency',
        title: 'Query Duration (ms)',
        unit: 'ms',
        series: [
          {
            name: 'Query duration',
            query:
              '(rate(prometheus_engine_query_duration_seconds_sum{job="prometheus"}[5m]) / rate(prometheus_engine_query_duration_seconds_count{job="prometheus"}[5m])) * 1000'
          }
        ]
      },
      {
        id: 'prom-head-chunks',
        title: 'Head Chunks',
        unit: 'count',
        series: [{ name: 'Chunks', query: 'prometheus_tsdb_head_chunks{job="prometheus"}' }]
      }
    ]
  },
  {
    slug: 'blackbox',
    title: 'Prometheus Blackbox Exporter',
    description: 'Endpoint uptime, response time, and probe health.',
    tags: ['blackbox', 'prometheus', 'status'],
    stats: [
      {
        id: 'blackbox-targets-up',
        label: 'Targets Up',
        query: 'sum(probe_success{job="blackbox-http"})',
        unit: 'count'
      },
      {
        id: 'blackbox-targets-total',
        label: 'Targets Total',
        query: 'count(probe_success{job="blackbox-http"})',
        unit: 'count'
      }
    ],
    charts: [
      {
        id: 'blackbox-uptime',
        title: 'Uptime %',
        unit: 'percent',
        series: [
          {
            name: 'Uptime',
            query: 'avg_over_time(probe_success{job="blackbox-http"}[5m]) * 100'
          }
        ]
      },
      {
        id: 'blackbox-response',
        title: 'Response Time (ms)',
        unit: 'ms',
        series: [
          {
            name: 'Response time',
            query: 'avg_over_time(probe_duration_seconds{job="blackbox-http"}[5m]) * 1000'
          }
        ]
      },
      {
        id: 'blackbox-uptime-by-target',
        title: 'Uptime by Target',
        unit: 'percent',
        series: [
          {
            query: 'avg_over_time(probe_success{job="blackbox-http"}[5m]) * 100',
            nameFromLabel: 'instance'
          }
        ]
      }
    ]
  },
  {
    slug: 'redis',
    title: 'Redis Dashboard (Exporter 1.x)',
    description: 'Clients, memory usage, throughput, and hit rate.',
    tags: ['prometheus', 'redis', 'database'],
    stats: [
      { id: 'redis-up', label: 'Up', query: 'max(up{job="redis"})', unit: 'count' },
      {
        id: 'redis-clients',
        label: 'Connected Clients',
        query: 'redis_connected_clients{job="redis"}',
        unit: 'count'
      },
      {
        id: 'redis-memory',
        label: 'Memory Used',
        query: 'redis_memory_used_bytes{job="redis"}',
        unit: 'bytes'
      }
    ],
    charts: [
      {
        id: 'redis-clients',
        title: 'Connected Clients',
        unit: 'count',
        series: [{ name: 'Clients', query: 'redis_connected_clients{job="redis"}' }]
      },
      {
        id: 'redis-memory',
        title: 'Memory Used',
        unit: 'bytes',
        series: [{ name: 'Memory', query: 'redis_memory_used_bytes{job="redis"}' }]
      },
      {
        id: 'redis-commands',
        title: 'Commands / sec',
        unit: 'ops',
        series: [
          { name: 'Commands', query: 'rate(redis_commands_processed_total{job="redis"}[5m])' }
        ]
      },
      {
        id: 'redis-hit-rate',
        title: 'Keyspace Hit Rate',
        unit: 'percent',
        series: [
          {
            name: 'Hit rate',
            query:
              '(rate(redis_keyspace_hits_total{job="redis"}[5m]) / (rate(redis_keyspace_hits_total{job="redis"}[5m]) + rate(redis_keyspace_misses_total{job="redis"}[5m]))) * 100'
          }
        ]
      },
      {
        id: 'redis-network',
        title: 'Network IO',
        unit: 'bytes',
        series: [
          { name: 'Input', query: 'rate(redis_net_input_bytes_total{job="redis"}[5m])' },
          { name: 'Output', query: 'rate(redis_net_output_bytes_total{job="redis"}[5m])' }
        ]
      }
    ]
  },
  {
    slug: 'vd-status',
    title: 'VD Status',
    description: 'Overall platform health and uptime signals.',
    tags: ['status', 'velvetdinosaur'],
    stats: [
      { id: 'vd-targets-up', label: 'Targets Up', query: 'sum(up)', unit: 'count' },
      { id: 'vd-targets-total', label: 'Targets Total', query: 'count(up)', unit: 'count' },
      {
        id: 'vd-http-uptime',
        label: 'HTTP Uptime',
        query: 'avg(probe_success{job="blackbox-http"}) * 100',
        unit: 'percent'
      }
    ],
    charts: [
      {
        id: 'vd-service-up',
        title: 'Service Availability',
        unit: 'percent',
        series: [
          {
            query:
              'avg by (job) (up{job=~"prometheus|node|nginx|mysql|redis|mongodb|blackbox-exporter"}) * 100',
            nameFromLabel: 'job'
          }
        ]
      },
      {
        id: 'vd-http-uptime-series',
        title: 'HTTP Uptime',
        unit: 'percent',
        series: [
          { name: 'Uptime', query: 'avg_over_time(probe_success{job="blackbox-http"}[5m]) * 100' }
        ]
      },
      {
        id: 'vd-http-response',
        title: 'HTTP Response Time (ms)',
        unit: 'ms',
        series: [
          {
            name: 'Response',
            query: 'avg_over_time(probe_duration_seconds{job="blackbox-http"}[5m]) * 1000'
          }
        ]
      },
      {
        id: 'vd-node-cpu',
        title: 'Node CPU Usage',
        unit: 'percent',
        series: [
          {
            name: 'CPU %',
            query:
              '100 - (avg(rate(node_cpu_seconds_total{job="node",mode="idle"}[5m])) * 100)'
          }
        ]
      }
    ]
  }
];

export function listDashboards(): DashboardMeta[] {
  return DASHBOARDS.map(({ slug, title, description, tags }) => ({
    slug,
    title,
    description,
    tags
  }));
}

export function getDashboard(slug: string) {
  return DASHBOARDS.find((dashboard) => dashboard.slug === slug) || null;
}
