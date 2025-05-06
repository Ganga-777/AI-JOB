-- Drop existing table if it exists
DROP TABLE IF EXISTS resumes;

-- Create resumes table
CREATE TABLE resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    parsed_content TEXT,
    ats_score DECIMAL(5,2),  -- Changed from NUMERIC to DECIMAL(5,2) for better precision control
    keywords TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT resumes_user_id_fkey 
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own resumes
CREATE POLICY "Users can view own resumes"
ON resumes
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Create policy to allow users to insert their own resumes
CREATE POLICY "Users can insert own resumes"
ON resumes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- Create policy to allow users to update their own resumes
CREATE POLICY "Users can update own resumes"
ON resumes
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Create policy to allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON resumes
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Create storage bucket for resumes if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('resumes', 'resumes', true, 5242880)  -- 5MB = 5 * 1024 * 1024
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Set up storage policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up storage policy to allow authenticated users to read their own files
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
); 