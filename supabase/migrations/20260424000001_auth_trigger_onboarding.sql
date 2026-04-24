-- Add onboarding_complete flag to users                                                                                                                                                                                                                                   
  alter table public.users
    add column onboarding_complete boolean not null default false;

  -- Function: auto-creates a public.users row when auth.users gets a new entry                                                                                                                                                                                              
  create or replace function public.handle_new_user()
  returns trigger                                                                                                                                                                                                                                                            
  language plpgsql
  security definer set search_path = ''                                                                                                                                                                                                                                      
  as $$
  begin                                                                                                                                                                                                                                                                      
    insert into public.users (id, email, name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(
        new.raw_user_meta_data->>'full_name',                                                                                                                                                                                                                                
        new.raw_user_meta_data->>'name',
        new.email                                                                                                                                                                                                                                                            
      ),
      new.raw_user_meta_data->>'avatar_url'                                                                                                                                                                                                                                  
    );
    return new;                                                                                                                                                                                                                                                              
  end;            
  $$;

  -- Trigger: fires once per new user after insert on auth.users                                                                                                                                                                                                             
  create trigger on_auth_user_created
    after insert on auth.users                                                                                                                                                                                                                                               
    for each row execute procedure public.handle_new_user();

  ---
