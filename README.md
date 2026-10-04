# FlowPilot ⚡

### Visual Workflow Automation Platform

FlowPilot is a visual workflow automation builder that lets users create, configure, save, and execute automated workflows by connecting **triggers, actions, conditions, and data transformations**.

Built for **ALG-AUTO-01 | Visual Workflow Automation**.

---

## 🚀 Problem

People repeatedly perform sequences of digital tasks across different tools and systems.

FlowPilot provides a visual way to define these sequences once and execute them as workflows, reducing repetitive manual work and making automation easier to understand.

---

## 💡 Solution

FlowPilot provides a drag-and-drop style visual workflow builder where users can connect different workflow components and execute them with a live execution log.

A workflow can contain:

- **Triggers** – start a workflow
- **Actions** – perform automated tasks
- **Conditions** – branch the workflow based on data
- **Transformations** – modify or reshape data
- **Execution Logs** – monitor each step of a workflow

---

## ✨ Key Features

### 🎯 Visual Workflow Builder
Create workflows by connecting nodes on a visual canvas.

### ⚡ Multiple Triggers
Supported triggers include:

- Webhook Received
- Form Submitted
- Schedule

### 🔧 Actions
Available actions include:

- Send Email
- Send Slack Message
- HTTP Request
- Create Notification

### 🔀 Conditional Branching
Use **If / Else** and **Filter** nodes to control workflow execution based on conditions.

### 🔄 Data Transformations
Transform workflow data using:

- Format Text
- Extract Field
- Convert Data

Example:

```text
Form Submitted
      ↓
Format Text
      ↓
HTTP Request
      ↓
If / Else