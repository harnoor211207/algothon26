import {
  Webhook,
  ClipboardList,
  Clock3,
  Mail,
  Slack,
  Globe,
  Bell,
  GitBranch,
  Filter,
  Type,
  ScanSearch,
  Repeat,
} from 'lucide-react'

export const NODE_CATALOG = [
  {
    id: 'webhook',
    category: 'trigger',
    title: 'Webhook Received',
    description: 'Start when an inbound webhook fires',
    icon: Webhook,
    defaults: {
      endpoint: '/hooks/new-lead',
      samplePayload: JSON.stringify(
        {
          lead: {
            name: 'Ava Chen',
            email: 'ava@acme.com',
            company: 'Acme Labs',
            score: 86,
          },
        },
        null,
        2
      ),
    },
  },
  {
    id: 'form',
    category: 'trigger',
    title: 'Form Submitted',
    description: 'Start when a form is submitted',
    icon: ClipboardList,
    defaults: {
      formName: 'Website Contact',
      samplePayload: JSON.stringify(
        {
          form: {
            name: 'Jordan Blake',
            email: 'jordan@example.com',
            message: 'Can we book a product demo this week?',
          },
        },
        null,
        2
      ),
    },
  },
  {
    id: 'schedule',
    category: 'trigger',
    title: 'Schedule',
    description: 'Start on a repeating schedule',
    icon: Clock3,
    defaults: {
      interval: 'Every weekday at 9:00 AM',
      samplePayload: JSON.stringify(
        {
          schedule: { reason: 'weekday-digest', window: '09:00' },
        },
        null,
        2
      ),
    },
  },
  {
    id: 'email',
    category: 'action',
    title: 'Send Email',
    description: 'Send a simulated outbound email',
    icon: Mail,
    defaults: {
      recipient: '{{lead.email}}',
      subject: 'New qualified lead: {{lead.name}}',
      message: 'Hi team,\n\n{{lead.name}} from {{lead.company}} just qualified with a score of {{lead.score}}.\n\nPlease follow up today.',
    },
  },
  {
    id: 'slack',
    category: 'action',
    title: 'Send Slack Message',
    description: 'Post a simulated Slack message',
    icon: Slack,
    defaults: {
      channel: '#sales-alerts',
      message: 'Hot lead: {{lead.name}} ({{lead.company}}) scored {{lead.score}}.',
    },
  },
  {
    id: 'http',
    category: 'action',
    title: 'HTTP Request',
    description: 'Call an external API (simulated)',
    icon: Globe,
    defaults: {
      method: 'POST',
      url: 'https://api.example.com/leads',
      body: '{"email":"{{lead.email}}"}',
    },
  },
  {
    id: 'notification',
    category: 'action',
    title: 'Create Notification',
    description: 'Create an in-app notification',
    icon: Bell,
    defaults: {
      title: 'Sales follow-up required',
      body: 'Reach out to {{lead.name}} at {{lead.email}}.',
    },
  },
  {
    id: 'condition',
    category: 'condition',
    title: 'If / Else',
    description: 'Branch when a condition is true or false',
    icon: GitBranch,
    defaults: {
      field: 'lead.score',
      operator: 'gt',
      value: '70',
    },
  },
  {
    id: 'filter',
    category: 'condition',
    title: 'Filter',
    description: 'Continue only when a filter matches',
    icon: Filter,
    defaults: {
      field: 'lead.email',
      operator: 'contains',
      value: '@',
    },
  },
  {
    id: 'format',
    category: 'transform',
    title: 'Format Text',
    description: 'Normalize a text field',
    icon: Type,
    defaults: {
      inputField: 'lead.name',
      transformType: 'titlecase',
      outputField: 'lead.displayName',
    },
  },
  {
    id: 'extract',
    category: 'transform',
    title: 'Extract Field',
    description: 'Copy a field into another key',
    icon: ScanSearch,
    defaults: {
      inputField: 'lead.email',
      outputField: 'notify.email',
    },
  },
  {
    id: 'convert',
    category: 'transform',
    title: 'Convert Data',
    description: 'Change a value into another type',
    icon: Repeat,
    defaults: {
      inputField: 'lead.score',
      convertType: 'number',
      outputField: 'lead.score',
    },
  },
]

export const CATEGORY_META = {
  trigger: { label: 'Triggers', tone: 'trigger' },
  action: { label: 'Actions', tone: 'action' },
  condition: { label: 'Conditions', tone: 'condition' },
  transform: { label: 'Transform', tone: 'transform' },
}

export function getCatalogItem(typeKey) {
  return NODE_CATALOG.find((item) => item.id === typeKey)
}

export function catalogByCategory() {
  return ['trigger', 'action', 'condition', 'transform'].map((category) => ({
    category,
    ...CATEGORY_META[category],
    items: NODE_CATALOG.filter((item) => item.category === category),
  }))
}
