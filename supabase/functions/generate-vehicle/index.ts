import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleType, paintColor, hasBullbar, hasBeacons, hasLightBar, hasXenon, hasSpoiler, hasRunningBoard, hasVisor, wheelType, hasTuningBumper, hasNeonKit, hasWideBodyKit, hasHood, hasExhaust } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const vehicleNames: Record<string, string> = {
      car: "a modern European sedan car (like a Peugeot 308 or Renault Megane)",
      truck: "a heavy-duty European box truck (like a Renault D-Series or DAF LF)",
      articulated: "a European articulated semi-truck with trailer (like a Renault T-Series or Scania R-Series)"
    };

    const vehicleName = vehicleNames[vehicleType] || vehicleNames.car;
    
    const colorDescriptions: Record<string, string> = {
      '#ffffff': 'white',
      '#ff0000': 'bright red',
      '#0000ff': 'royal blue',
      '#ffd700': 'metallic gold',
      '#000000': 'glossy black',
      '#00ff00': 'lime green',
      '#ff8800': 'orange',
      '#888888': 'silver grey',
      '#c0c0c0': 'silver metallic',
      '#9900ff': 'cosmic purple',
      '#1a1a1a': 'matte black',
      '#cc0033': 'candy red',
      '#0044cc': 'deep blue with painted flame decals on the sides',
      '#39ff14': 'neon green glow effect paint',
      '#ff6600': 'pearl orange like the Toyota Supra from Fast and Furious',
      '#e8e8e8': 'full chrome mirror wrap finish',
      '#4b0082': 'midnight purple like the Nissan Skyline R34 from Fast and Furious',
      '#32cd32': 'candy lime green with metallic flake',
      '#1a237e': 'galaxy blue with metallic pearl finish',
    };
    
    const colorDesc = colorDescriptions[paintColor?.toLowerCase()] || `painted in the color ${paintColor}`;

    const wheelDescriptions: Record<string, string> = {
      chrome: 'shiny chrome alloy wheels',
      bbs: 'iconic BBS RS mesh wheels with gold centers',
      oz_racing: 'OZ Racing Ultraleggera lightweight wheels',
      vossen: 'Vossen CVT forged concave wheels',
      rotiform: 'Rotiform BLQ monoblock wheels',
      work_meister: 'Work Meister S1R deep dish wheels',
    };

    const accessories: string[] = [];
    if (hasBullbar) accessories.push("a front bull bar / brush guard");
    if (hasBeacons) accessories.push("amber rotating beacons on the roof");
    if (hasLightBar) accessories.push("an LED light bar on top");
    if (hasXenon) accessories.push("bright xenon headlights");
    if (hasSpoiler) accessories.push("a rear spoiler");
    if (hasRunningBoard) accessories.push("side running boards / step bars");
    if (hasVisor) accessories.push("a sun visor above the windshield");
    if (wheelType && wheelDescriptions[wheelType]) accessories.push(wheelDescriptions[wheelType]);
    if (hasTuningBumper) accessories.push("an aggressive aftermarket tuning front bumper with splitter");
    if (hasNeonKit) accessories.push("underglow neon LED lights glowing under the vehicle");
    if (hasWideBodyKit) accessories.push("a widebody kit with flared fenders");
    if (hasHood) accessories.push("a racing hood with a large air intake scoop");
    if (hasExhaust) accessories.push("a dual sport exhaust with large chrome tips");

    const accessoryText = accessories.length > 0 
      ? `The vehicle is equipped with: ${accessories.join(", ")}.` 
      : "";

    const prompt = `Generate a photorealistic studio photograph of ${vehicleName}, ${colorDesc} paint finish, shot from a 3/4 front angle. The vehicle is on a clean dark studio background with dramatic lighting. ${accessoryText} Ultra-detailed, professional automotive photography style, high resolution, sharp focus. No text, no watermarks, no logos.`;

    console.log("Generating vehicle with Gemini API directly, prompt:", prompt.substring(0, 100) + "...");

    // Use Gemini API directly with the user's own API key
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      // Fallback: try Imagen 3
      console.log("Trying Imagen 4 Fast as fallback...");
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`;
      const imagenResponse = await fetch(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      });

      if (!imagenResponse.ok) {
        const imagenError = await imagenResponse.text();
        console.error("Imagen API error:", imagenResponse.status, imagenError);
        throw new Error(`Gemini: ${response.status}, Imagen: ${imagenResponse.status}`);
      }

      const imagenData = await imagenResponse.json();
      const imagenB64 = imagenData.predictions?.[0]?.bytesBase64Encoded;
      if (!imagenB64) throw new Error("No image from Imagen");

      // Upload Imagen result
      const imageBytes = decode(imagenB64);
      return await uploadAndReturn(imageBytes, "image/png");
    }

    const data = await response.json();
    console.log("Gemini response received");

    // Extract image from Gemini response
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No parts in Gemini response");

    let imageBase64: string | null = null;
    let mimeType = "image/png";

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageBase64) {
      console.error("No image in response parts:", JSON.stringify(parts).substring(0, 500));
      throw new Error("No image generated by Gemini");
    }

    const imageBytes = decode(imageBase64);
    return await uploadAndReturn(imageBytes, mimeType);

  } catch (e) {
    console.error("generate-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function uploadAndReturn(imageBytes: Uint8Array, mimeType: string): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ext = mimeType === "image/jpeg" ? "jpg" : "png";
  const fileName = `vehicle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  
  const { error: uploadError } = await supabase.storage
    .from('vehicle-images')
    .upload(fileName, imageBytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    // Fallback: return as data URL
    const b64 = btoa(String.fromCharCode(...imageBytes));
    return new Response(JSON.stringify({ imageUrl: `data:${mimeType};base64,${b64}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: publicUrlData } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(fileName);

  console.log("Vehicle image uploaded:", fileName);

  return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
