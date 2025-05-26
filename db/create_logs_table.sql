CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES task_registration(id),
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,  -- GOREV_AC, GOREV_KAPAT, UZUN_YOL, KADEME_GIRIS, KADEME_CIKIS
    vehicle_id INTEGER REFERENCES vehicles(id),
    action_details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
