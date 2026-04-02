import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleType, paintColor, hasBullbar, hasBeacons, hasLightBar, hasXenon, hasSpoiler, hasRunningBoard, hasVisor, wheelType } = await req.json();

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
    };
    
    const colorDesc = colorDescriptions[paintColor?.toLowerCase()] || `painted in the color ${paintColor}`;

    const accessories: string[] = [];
    if (hasBullbar) accessories.push("a front bull bar / brush guard");
    if (hasBeacons) accessories.push("amber rotating beacons on the roof");
    if (hasLightBar) accessories.push("an LED light bar on top");
    if (hasXenon) accessories.push("bright xenon headlights");
    if (hasSpoiler) accessories.push("a rear spoiler");
    if (hasRunningBoard) accessories.push("side running boards / step bars");
    if (hasVisor) accessories.push("a sun visor above the windshield");
    if (wheelType === 'chrome') accessories.push("shiny chrome alloy wheels");

    const accessoryText = accessories.length > 0 
      ? `The vehicle is equipped with: ${accessories.join(", ")}.` 
      : "";

    const prompt = `Create a photorealistic studio photograph of ${vehicleName}, ${colorDesc} paint finish, shot from a 3/4 front angle. The vehicle is on a clean dark studio background with dramatic lighting. ${accessoryText} Ultra-detailed, professional automotive photography style, high resolution, sharp focus. No text, no watermarks, no logos.`;

    console.log("Generating vehicle with prompt:", prompt);

    let imageBase64 = "";
    let mimeType = "image/png";
    let lastError = "";

    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        });

        if (response.status === 404) {
          const t = await response.text();
          console.warn(`Model ${model} not found, trying next...`, t);
          lastError = `Model ${model} not found`;
          continue;
        }

        if (response.status === 429) {
          const t = await response.text();
          console.warn(`Rate limited on ${model}`, t);
          lastError = "Rate limited";
          continue;
        }

        if (!response.ok) {
          const t = await response.text();
          console.error(`Error with model ${model}:`, response.status, t);
          lastError = `${model}: ${response.status}`;
          continue;
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts;
        
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              imageBase64 = part.inlineData.data;
              mimeType = part.inlineData.mimeType || "image/png";
              break;
            }
          }
        }

        if (imageBase64) {
          console.log(`Successfully generated image with model: ${model}`);
          break;
        } else {
          console.warn(`No image in response from ${model}`);
          lastError = `No image from ${model}`;
        }
      } catch (err) {
        console.error(`Exception with model ${model}:`, err);
        lastError = `${model}: ${err instanceof Error ? err.message : 'unknown'}`;
      }
    }

    if (!imageBase64) {
      console.error("All models failed. Last error:", lastError);
      return new Response(JSON.stringify({ error: `Image generation failed: ${lastError}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to Supabase Storage
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
      // Fallback to base64
      const imageUrl = `data:${mimeType};base64,${imageBase64}`;
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
