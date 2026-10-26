-- 사진 보관함(photos)을 만든다. 공개 보관함 = 사진 주소를 아는 누구나 볼 수 있다.
-- 사진 파일만, 한 장 5MB까지 받는다. 두 번 Run 해도 오류가 나지 않는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- 규칙: 공개 키로 들어온 사람은 photos 보관함에 사진을 올리고(insert) 목록을 볼(select) 수 있다.
-- 바꾸기·지우기 규칙은 없다 → 공개 키로는 아무도 남의 사진을 바꾸거나 지울 수 없다.
drop policy if exists "photos_insert" on storage.objects;
create policy "photos_insert" on storage.objects
  for insert to anon with check (bucket_id = 'photos');

drop policy if exists "photos_select" on storage.objects;
create policy "photos_select" on storage.objects
  for select to anon using (bucket_id = 'photos');
