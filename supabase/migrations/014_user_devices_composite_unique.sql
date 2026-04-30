-- Drop the existing unique constraint on fcm_token
alter table public.user_devices drop constraint if exists user_devices_fcm_token_key;

-- Add a composite unique constraint on user_id and fcm_token
alter table public.user_devices add constraint user_devices_user_id_fcm_token_key unique (user_id, fcm_token);
