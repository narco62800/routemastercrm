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

// Marques aléatoires par type de véhicule
function getRandomBrand(vehicleType: string): string {
  const brands: Record<string, string[]> = {
    car: ['Mercedes-Benz C-Class', 'BMW 3 Series', 'Audi A4', 'Peugeot 508', 'Renault Talisman', 'Volkswagen Passat'],
    truck: ['Renault T High 2026', 'Volvo FH 2026', 'Scania R 2026', 'DAF XG 2026', 'Mercedes-Benz Actros 2026', 'MAN TGX 2026'],
    articulated: ['Volvo FH16 2026 with curtainsider trailer', 'Scania R650 2026 with refrigerated trailer', 'Renault T520 2026 with semi-trailer', 'DAF XG+ 2024 with tanker trailer', 'Mercedes Actros 1863 2026 with flatbed trailer'],
  }
  const list = brands[vehicleType] ?? brands['truck']
  return list[Math.floor(Math.random() * list.length)]
}

function buildVehiclePrompt(params: VehicleParams): string {
  const colorName = hexToColorName(params.color)
  const brand = getRandomBrand(params.vehicle_type)
  const acc = params.accessories?.length ? `, equipped with ${params.accessories.join(', ')}` : ''
  return `${colorName} ${brand}${acc}, driving on a French motorway, golden hour lighting, photorealistic, ultra detailed, 8K, side view, clean sky background, professional automotive photography`
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
