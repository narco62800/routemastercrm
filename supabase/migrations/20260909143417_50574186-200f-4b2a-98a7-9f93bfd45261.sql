CREATE POLICY "Public read cours" ON storage.objects FOR SELECT USING (bucket_id = 'cours');
CREATE POLICY "Public upload cours" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cours');
CREATE POLICY "Public update cours" ON storage.objects FOR UPDATE USING (bucket_id = 'cours');
CREATE POLICY "Public delete cours" ON storage.objects FOR DELETE USING (bucket_id = 'cours');