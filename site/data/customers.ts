export type CustomerStatus = "Active" | "Trial" | "At risk";

export interface Customer {
  id: string;
  name: string;
  company: string;
  plan: string;
  status: CustomerStatus;
  seats: number;
  revenue: number;
  lastActive: string;
}

export const customers: Customer[] = [
  {
    id: "acme",
    name: "Maya Chen",
    company: "Acme Systems",
    plan: "Enterprise",
    status: "Active",
    seats: 128,
    revenue: 18600,
    lastActive: "2 min ago",
  },
  {
    id: "northstar",
    name: "Theo Martin",
    company: "Northstar Labs",
    plan: "Growth",
    status: "Active",
    seats: 42,
    revenue: 6400,
    lastActive: "18 min ago",
  },
  {
    id: "vertex",
    name: "Iris Walker",
    company: "Vertex Health",
    plan: "Enterprise",
    status: "At risk",
    seats: 86,
    revenue: 12100,
    lastActive: "Yesterday",
  },
  {
    id: "plume",
    name: "Noah Silva",
    company: "Plume Finance",
    plan: "Growth",
    status: "Trial",
    seats: 18,
    revenue: 2400,
    lastActive: "3 hours ago",
  },
  {
    id: "orbit",
    name: "Ava Patel",
    company: "Orbit Works",
    plan: "Starter",
    status: "Active",
    seats: 9,
    revenue: 900,
    lastActive: "5 hours ago",
  },
  {
    id: "cedar",
    name: "Leo Brooks",
    company: "Cedar & Co.",
    plan: "Growth",
    status: "Active",
    seats: 31,
    revenue: 4800,
    lastActive: "2 days ago",
  },
  {
    id: "arc",
    name: "Sofia Kim",
    company: "Arc Manufacturing",
    plan: "Enterprise",
    status: "At risk",
    seats: 214,
    revenue: 27600,
    lastActive: "4 days ago",
  },
  {
    id: "clearwater",
    name: "Eli Turner",
    company: "Clearwater",
    plan: "Starter",
    status: "Trial",
    seats: 6,
    revenue: 600,
    lastActive: "1 hour ago",
  },
];

export const activities = [
  { title: "Acme Systems expanded to 128 seats", detail: "Maya Chen · Enterprise", time: "2 min" },
  { title: "Quarterly review completed", detail: "Northstar Labs · Success", time: "24 min" },
  { title: "Usage threshold reached", detail: "Vertex Health · Risk signal", time: "1 hr" },
  { title: "Trial workspace created", detail: "Clearwater · Sales", time: "3 hr" },
];
