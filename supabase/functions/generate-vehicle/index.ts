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

    const vehicleNames: Record<string, string> = {
      car: "a modern European sedan car (like a Peugeot 308 or Renault Megane)",
      truck: "a heavy-duty European rigid box truck (like a Renault D-Series or DAF LF) with a single chassis and integrated cargo box, NOT an articulated truck",
      articulated: "a European articulated semi-truck with a separate tractor unit pulling a long trailer (like a Renault T-Series or Scania R-Series)"
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

    const prompt = `Photorealistic studio photograph of ${vehicleName}, ${colorDesc} paint finish, shot from a 3/4 front angle. Clean dark studio background with dramatic lighting. ${accessoryText} Ultra-detailed, professional automotive photography style, high resolution, sharp focus. No text, no watermarks, no logos.`;

    console.log("Generating vehicle with Pollinations.ai, prompt:", prompt.substring(0, 100) + "...");

    // Use Pollinations.ai — 100% free, no API key needed
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`;

    // Pollinations returns the image directly as binary
    const response = await fetch(pollinationsUrl, {
      method: "GET",
      headers: { "Accept": "image/*" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pollinations error:", response.status, errorText);
      throw new Error(`Pollinations error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = new Uint8Array(await response.arrayBuffer());
    
    console.log("Image received from Pollinations, size:", imageBuffer.length, "bytes");

    if (imageBuffer.length < 1000) {
      throw new Error("Image too small, generation may have failed");
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ext = contentType.includes("png") ? "png" : "jpg";
    const fileName = `vehicle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("Failed to upload image to storage");
    }

    const { data: publicUrlData } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName);

    console.log("Vehicle image uploaded successfully:", fileName);

    return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
