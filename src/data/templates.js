import { createId } from '../utils/helpers'
import { getCatalogItem } from './nodeCatalog'

function nodeFromCatalog(typeKey, position, extraConfig = {}) {
  const item = getCatalogItem(typeKey)
  return {
    id: createId('node'),
    type: item.category,
    position,
    data: {
      typeKey: item.id,
      label: item.title,
      description: item.description,
      category: item.category,
      config: { ...item.defaults, ...extraConfig },
    },
  }
}

function edge(source, target, sourceHandle) {
  return {
    id: createId('edge'),
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {}),
    type: 'smoothstep',
    animated: true,
  }
}

export function buildTemplateGraph(kind) {
  if (kind === 'lead') {
    const webhook = nodeFromCatalog('webhook', { x: 280, y: 24 })
    const condition = nodeFromCatalog('condition', { x: 262, y: 196 }, {
      field: 'lead.score',
      operator: 'gt',
      value: '70',
    })
    const transform = nodeFromCatalog('format', { x: 268, y: 384 }, {
      inputField: 'lead.name',
      transformType: 'titlecase',
      outputField: 'lead.displayName',
    })
    const email = nodeFromCatalog('email', { x: 276, y: 564 }, {
      recipient: '{{lead.email}}',
      subject: 'Sales alert: {{lead.name}}',
      message: '{{lead.displayName}} from {{lead.company}} is ready for outreach.',
    })
    return {
      nodes: [webhook, condition, transform, email],
      edges: [
        edge(webhook.id, condition.id),
        edge(condition.id, transform.id, 'true'),
        edge(transform.id, email.id),
      ],
    }
  }

  if (kind === 'form-slack') {
    const form = nodeFromCatalog('form', { x: 280, y: 40 })
    const transform = nodeFromCatalog('extract', { x: 268, y: 220 }, {
      inputField: 'form.email',
      outputField: 'notify.email',
    })
    const slack = nodeFromCatalog('slack', { x: 276, y: 400 }, {
      channel: '#inbound',
      message: 'New form from {{form.name}}: {{form.message}} ({{notify.email}})',
    })
    return {
      nodes: [form, transform, slack],
      edges: [edge(form.id, transform.id), edge(transform.id, slack.id)],
    }
  }

  if (kind === 'order') {
    const webhook = nodeFromCatalog('webhook', { x: 280, y: 32 }, {
      endpoint: '/hooks/orders',
      samplePayload: JSON.stringify(
        {
          order: { id: 'ORD-2048', total: 240, status: 'paid' },
          lead: { name: 'River Patel', email: 'river@shop.co', score: 91 },
        },
        null,
        2
      ),
    })
    const condition = nodeFromCatalog('condition', { x: 262, y: 214 }, {
      field: 'order.status',
      operator: 'equals',
      value: 'paid',
    })
    const notification = nodeFromCatalog('notification', { x: 250, y: 404 }, {
      title: 'Order {{order.id}} paid',
      body: 'Fulfill order {{order.id}} for {{lead.name}} ({{order.total}}).',
    })
    return {
      nodes: [webhook, condition, notification],
      edges: [edge(webhook.id, condition.id), edge(condition.id, notification.id, 'true')],
    }
  }

  const form = nodeFromCatalog('form', { x: 280, y: 20 })
  const transform = nodeFromCatalog('format', { x: 268, y: 196 }, {
    inputField: 'form.name',
    transformType: 'titlecase',
    outputField: 'customer.name',
  })
  const email = nodeFromCatalog('email', { x: 276, y: 372 }, {
    recipient: '{{form.email}}',
    subject: 'Thanks for reaching out, {{customer.name}}',
    message: 'We received your note and a specialist will follow up shortly.',
  })
  const notification = nodeFromCatalog('notification', { x: 250, y: 560 }, {
    title: 'Follow-up queued',
    body: 'Send a personal note to {{customer.name}}.',
  })
  return {
    nodes: [form, transform, email, notification],
    edges: [
      edge(form.id, transform.id),
      edge(transform.id, email.id),
      edge(email.id, notification.id),
    ],
  }
}

export const TEMPLATES = [
  {
    id: 'tpl-lead',
    kind: 'lead',
    name: 'Lead Notification',
    description: 'Qualify inbound webhook leads and email the sales team.',
    category: 'Sales',
    nodeCount: 4,
  },
  {
    id: 'tpl-form-slack',
    kind: 'form-slack',
    name: 'Form to Slack',
    description: 'Route website form submissions into a Slack channel.',
    category: 'Support',
    nodeCount: 3,
  },
  {
    id: 'tpl-order',
    kind: 'order',
    name: 'Order Processing',
    description: 'Confirm paid orders and create an internal notification.',
    category: 'Operations',
    nodeCount: 3,
  },
  {
    id: 'tpl-followup',
    kind: 'followup',
    name: 'Customer Follow-up',
    description: 'Thank a new contact and queue an internal reminder.',
    category: 'Customer Success',
    nodeCount: 4,
  },
]

export function buildDemoWorkflow() {
  const webhook = nodeFromCatalog('webhook', { x: 290, y: 16 }, {
    endpoint: '/hooks/new-lead',
  })
  const condition = nodeFromCatalog('condition', { x: 272, y: 196 }, {
    field: 'lead.score',
    operator: 'gt',
    value: '70',
  })
  const transform = nodeFromCatalog('format', { x: 278, y: 384 }, {
    inputField: 'lead.name',
    transformType: 'titlecase',
    outputField: 'lead.displayName',
  })
  const slack = nodeFromCatalog('slack', { x: 286, y: 564 }, {
    channel: '#sales-alerts',
    message: 'Hot lead: {{lead.displayName}} from {{lead.company}} scored {{lead.score}}.',
  })
  const notification = nodeFromCatalog('notification', { x: 260, y: 744 }, {
    title: 'Notify sales',
    body: 'Call {{lead.displayName}} at {{lead.email}} today.',
  })

  return {
    id: createId('wf'),
    name: 'New Lead → Notify Sales',
    description: 'Qualify high-intent inbound leads, alert Slack, and notify the sales desk.',
    status: 'active',
    nodes: [webhook, condition, transform, slack, notification],
    edges: [
      edge(webhook.id, condition.id),
      edge(condition.id, transform.id, 'true'),
      edge(transform.id, slack.id),
      edge(slack.id, notification.id),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRunAt: null,
    lastRunStatus: null,
  }
}
