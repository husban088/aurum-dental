export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt?: string | null;
}
export interface AuthResponse {
  token: string;
  user: User;
}
export type Status = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export const STATUSES: Status[] = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];
export interface Appointment {
  id: string;
  name: string;
  phone: string;
  service: string;
  doctor: string;
  date: string;
  time: string;
  status: Status;
  note?: string | null;
}
export interface AppointmentRequest {
  name: string;
  phone: string;
  service: string;
  doctor: string;
  date: string;
  time: string;
  note?: string;
}
export interface Review {
  id: string;
  name: string;
  treat: string;
  rating: number;
  text: string;
  date: string;
}
export interface ReviewRequest {
  name: string;
  treat: string;
  rating: number;
  text: string;
}
export interface Activity {
  id: string;
  type: string;
  message: string;
  at: string;
}
export interface Count {
  name: string;
  count: number;
}
export interface Analytics {
  total: number;
  byTreatment: Count[];
  byDoctor: Count[];
  events: Record<string, number>;
}
