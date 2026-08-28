-- Enable PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id VARCHAR(100) UNIQUE NOT NULL,
    village VARCHAR(255),
    block VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(20),
    latitude NUMERIC(12, 7),
    longitude NUMERIC(12, 7),
    area_sq_m NUMERIC(15, 2),
    confidence_score NUMERIC(5, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    property_type VARCHAR(100),
    build_material VARCHAR(100),
    floors INTEGER DEFAULT 1,
    roof_type VARCHAR(100),
    condition VARCHAR(50),
    owner_name VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_email VARCHAR(255),
    field_worker VARCHAR(100),
    verification_step VARCHAR(50) DEFAULT 'UNDER_REVIEW',
    site_photos TEXT,
    geometry geometry(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SOURCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.source_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_uuid UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL,
    external_record_id VARCHAR(255),
    village VARCHAR(255),
    block VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(20),
    latitude NUMERIC(12, 7),
    longitude NUMERIC(12, 7),
    raw_data JSONB DEFAULT '{}'::jsonb,
    normalized_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROPERTY MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.property_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    source_record_1_id UUID REFERENCES public.source_records(id) ON DELETE CASCADE,
    source_record_2_id UUID REFERENCES public.source_records(id) ON DELETE CASCADE,
    confidence_score NUMERIC(5, 2) NOT NULL,
    match_status VARCHAR(50) DEFAULT 'MATCHED',
    feature_scores JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_matches ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies for Publishable API Key
CREATE POLICY "Allow public read access on properties"
    ON public.properties FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public insert on properties"
    ON public.properties FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public update on properties"
    ON public.properties FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public all on source_records"
    ON public.source_records FOR ALL
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public all on property_matches"
    ON public.property_matches FOR ALL
    TO anon, authenticated
    USING (true);

-- 6. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
