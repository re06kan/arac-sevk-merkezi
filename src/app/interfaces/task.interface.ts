import { GorevDurumu } from '../dashboard/gorev-kayit/gorev-kayit.component';

export interface Task {
  id: number;
  task_status: string;
  task_type: string;
  route_description?: string;
  maintenance_id?: number;  // Eklendi
  start_km: number;
  end_km?: number;
  driver_id: number;
  ordered_by: string;
  task_paper_no: string;
  return_message?: string;
  vehicle_id: number;
  start_date: string;
  end_date?: string;
  assigned_authority_id: number;
  created_at: string;
  updated_at: string;
}
