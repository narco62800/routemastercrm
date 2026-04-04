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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Highly specific vehicle descriptions to avoid confusion between types
    const vehiclePrompts: Record<string, string> = {
      car: `a modern European 5-door hatchback passenger car, similar to a Peugeot 308 or Volkswagen Golf. It is a SMALL personal automobile with 4 wheels, a low roof, a short hood, a hatchback trunk, and standard car proportions. This is NOT a truck, NOT a van, NOT a commercial vehicle. It seats 5 passengers.`,
      truck: `a European rigid box truck (porteur / straight truck) with a FIXED cargo box body permanently attached to the chassis. Similar to a Renault D-Series, DAF LF, or MAN TGL. It has a cab in front and a large rectangular cargo box behind it — all on ONE single rigid frame with 2 axles (6 wheels total). This is NOT an articulated truck, it does NOT have a detachable trailer, it does NOT have a fifth wheel coupling. The cargo box and the cab are part of the SAME vehicle.`,
      articulated: `a European articulated semi-truck consisting of TWO separate parts connected together: (1) a tractor unit / cab (like a Renault T-Series, Scania R-Series, or Volvo FH) with a fifth wheel coupling, and (2) a LONG semi-trailer attached behind it. The semi-trailer is a large enclosed box trailer with its own set of wheels at the rear. The ENTIRE combination must be shown: the tractor cab pulling the long semi-trailer. The total length is approximately 16 meters. This is NOT just a cab — the trailer MUST be visible and attached.`
    };

    const vehicleDesc = vehiclePrompts[vehicleType] || vehiclePrompts.car;
    
    const colorDescriptions: Record<string, string> = {
      '#ffffff': 'clean white',
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
    if (hasBullbar) accessories.push("a front bull bar / brush guard mounted on the front bumper");
    if (hasBeacons) accessories.push("amber rotating beacons on the roof of the cab");
    if (hasLightBar) accessories.push("an LED light bar mounted on top of the cab");
    if (hasXenon) accessories.push("bright xenon/LED headlights");
    if (hasSpoiler) accessories.push("a rear spoiler on the roof");
    if (hasRunningBoard) accessories.push("chrome side running boards / step bars");
    if (hasVisor) accessories.push("a sun visor above the windshield");
    if (wheelType && wheelDescriptions[wheelType]) accessories.push(wheelDescriptions[wheelType]);
    if (hasTuningBumper) accessories.push("an aggressive aftermarket sport front bumper with splitter");
    if (hasNeonKit) accessories.push("underglow neon LED lights glowing beneath the vehicle chassis");
    if (hasWideBodyKit) accessories.push("a widebody kit with flared wheel arches");
    if (hasHood) accessories.push("a racing hood/bonnet with a large air intake scoop");
    if (hasExhaust) accessories.push("a dual sport exhaust system with large chrome tips visible at the rear");

    const accessoryText = accessories.length > 0 
      ? `ACCESSORIES installed on the vehicle: ${accessories.join("; ")}.` 
      : "The vehicle has no aftermarket accessories — it is in stock/factory condition.";

    // Vehicle-type specific composition instructions
    const compositionInstructions: Record<string, string> = {
      car: "Frame the entire car in the shot, showing all 4 wheels touching the ground. The car should be centered.",
      truck: "Frame the entire rigid truck in the shot from cab to rear of the cargo box. Show the complete vehicle with both axles visible. The cargo box must be clearly attached to the same chassis as the cab.",
      articulated: "CRITICAL: Frame the COMPLETE articulated truck showing BOTH the tractor unit AND the full-length semi-trailer behind it. The trailer must extend to the right side of the image. Both the cab and the entire trailer must be fully visible — do NOT crop the trailer. Show the connection point between tractor and trailer.",
    };

    const composition = compositionInstructions[vehicleType] || compositionInstructions.car;

    const prompt = `Generate a photorealistic studio photograph of ${vehicleDesc}

The vehicle has a ${colorDesc} paint finish on the entire body.

${accessoryText}

COMPOSITION: Shot from a 3/4 front-left angle on a clean dark studio background with professional dramatic lighting. ${composition}

STYLE: Ultra-detailed professional automotive photography, commercial advertising quality, sharp focus, high resolution. Absolutely no text, no watermarks, no logos, no license plates, no people.`;

    console.log("Generating vehicle with prompt:", prompt.substring(0, 200) + "...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: prompt }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Gateway response received, checking for images...");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in AI response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated by AI model");
    }

    const base64Match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      console.log("Image is a direct URL, returning as-is");
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = base64Match[1];
    const imageBase64 = base64Match[2];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ext = mimeType === "image/jpeg" ? "jpg" : "png";
    const fileName = `vehicle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    
    const imageBytes = decode(imageBase64);
    
    const { error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, imageBytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log("Vehicle image uploaded successfully:", fileName);

    return new Response(JSON.stringify({ imageUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
