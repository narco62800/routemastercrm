import { supabase } from '@/integrations/supabase/client'

interface VehicleParams {
  vehicle_type: string
  vehicle_model: string
  color: string
  accessories?: string[]
}

function buildCacheKey(params: VehicleParams): string {
  const acc = (params.accessories ?? []).sort().join('-')
  const raw = `${params.vehicle_type}_${params.vehicle_model}_${params.color}_${acc}`
  return raw.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '.webp'
}

async function getCachedImageUrl(cacheKey: string): Promise<string | null> {
  try {
    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(cacheKey)
    const res = await fetch(data.publicUrl, { method: 'HEAD' })
    return res.ok ? data.publicUrl : null
  } catch {
    return null
  }
}

function buildVehiclePrompt(params: VehicleParams): string {
  const acc = params.accessories?.join(', ') ?? 'standard'
  return `Professional photo of a ${params.vehicle_type} truck ${params.vehicle_model}, color ${params.color}, accessories: ${acc}, on a French highway, sunny day, photorealistic, high quality, side view, 4K resolution`
}

async function generateWithPollinations(prompt: string): Promise<Blob> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=768&nologo=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Pollinations failed')
  return res.blob()
}

export async function getVehicleImage(params: VehicleParams): Promise<string> {
  const cacheKey = buildCacheKey(params)

  const cached = await getCachedImageUrl(cacheKey)
  if (cached) return cached

  const prompt = buildVehiclePrompt(params)

  try {
    const imageBlob = await generateWithPollinations(prompt)

    const { error } = await supabase.storage
      .from('vehicle-images')
      .upload(cacheKey, imageBlob, { contentType: 'image/webp', upsert: false })

    if (error) console.error('Upload cache failed:', error)

    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(cacheKey)
    return data.publicUrl
  } catch (err) {
    console.error('Image generation failed:', err)
    return 'https://via.placeholder.com/1024x768?text=Vehicle'
  }
}
