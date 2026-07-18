-- Stage 3: store email on membership rows so the roster shows who's who.
alter table organization_members add column if not exists email text;
