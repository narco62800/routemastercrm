
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Service role can insert vehicle images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Service role can update vehicle images" ON storage.objects
FOR UPDATE USING (bucket_id = 'vehicle-images');
