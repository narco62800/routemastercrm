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

function hexToColorName(hex: string): string {
  const map: Record<string, string> = {
    '#ffffff': 'white', '#000000': 'black', '#ff0000': 'red',
    '#0000ff': 'blue', '#ffd700': 'gold', '#00ff00': 'bright green',
    '#ff8800': 'orange', '#c0c0c0': 'silver', '#9900ff': 'purple',
    '#1a1a1a': 'matte black', '#cc0033': 'dark red', '#0044cc': 'electric blue',
    '#39ff14': 'neon green', '#ff6600': 'pearl orange', '#e8e8e8': 'chrome',
    '#4b0082': 'midnight purple', '#32cd32': 'lime green', '#1a237e': 'deep blue',
  }
  return map[hex.toLowerCase()] ?? 'white'
}

function buildVehiclePrompt(params: VehicleParams): string {
  const colorName = hexToColorName(params.color)
  const acc = params.accessories?.length ? params.accessories.join(', ') : 'no accessories'

  const prompts: Record<string, string> = {
    car: `${colorName} Renault Kangoo delivery van, ${acc}, parked on a French road, realistic photo, side view, cinematic lighting, 4K, clean background`,
    truck: `${colorName} Renault Trucks D cab, rigid truck, ${acc}, French highway, realistic photo, side view, cinematic lighting, 4K`,
    articulated: `${colorName} Volvo FH semi-truck with curtainsider trailer, ${acc}, French motorway, realistic photo, side view, cinematic lighting, 4K`,
  }

  return prompts[params.vehicle_type] ?? `${colorName} truck on a French road, ${acc}, realistic photo, side view, 4K`
}

export async function getVehicleImage(params: VehicleParams): Promise<string> {
  const cacheKey = buildCacheKey(params)

  const cached = await getCachedImageUrl(cacheKey)
  if (cached) return cached

  const prompt = buildVehiclePrompt(params)
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=768&nologo=true`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Pollinations failed')
    const imageBlob = await res.blob()

    const { error } = await supabase.storage
      .from('vehicle-images')
      .upload(cacheKey, imageBlob, { contentType: 'image/webp', upsert: false })

    if (error) console.error('Upload cache failed:', error)

    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(cacheKey)
    return data.publicUrl
  } catch (err) {
    console.error('Image generation failed:', err)
    return 'https://placehold.co/1024x768?text=Vehicle'
  }
}
