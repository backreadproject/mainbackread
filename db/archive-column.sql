-- Archive support for documents (Stage 1).
alter table documents add column if not exists archived_at timestamptz;
