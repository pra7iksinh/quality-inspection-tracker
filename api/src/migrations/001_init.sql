CREATE TABLE users (
  id            serial PRIMARY KEY,
  username      text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inspections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid UNIQUE,
  inspection_date date NOT NULL,
  machine_id      text NOT NULL,
  defect_type     text NOT NULL CHECK (defect_type IN
                    ('Weave Defect', 'Shade Variation', 'Hole/Tear', 'Count Deviation', 'Other')),
  severity        text NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor')),
  remarks         text,
  status          text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
  resolution_note text,
  resolved_at     timestamptz,
  source          text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'sap')),
  created_by      integer REFERENCES users (id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'Resolved' OR resolution_note IS NOT NULL)
);

CREATE INDEX idx_inspections_status   ON inspections (status);
CREATE INDEX idx_inspections_severity ON inspections (severity);
CREATE INDEX idx_inspections_date     ON inspections (inspection_date);
