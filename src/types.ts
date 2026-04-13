export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export type Priority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority | null;
  due_date: string | null;
  user_id: string;
  created_at: string;
}