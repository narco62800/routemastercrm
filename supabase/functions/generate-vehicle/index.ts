import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleType, paintColor, hasBullbar, hasBeacons, hasLightBar, hasXenon, hasSpoiler } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a detailed prompt based on customizations
    const vehicleNames: Record<string, string> = {
      car: "a modern European sedan car (like a Peugeot 308 or Renault Megane)",
      truck: "a heavy-duty European box truck (like a Renault D-Series or DAF LF)",
      articulated: "a European articulated semi-truck with trailer (like a Renault T-Series or Scania R-Series)"
    };

    const vehicleName = vehicleNames[vehicleType] || vehicleNames.car;
    
    // Convert hex color to a descriptive color name
    const colorDescriptions: Record<string, string> = {
      '#ffffff': 'white',
      '#ff0000': 'bright red',
      '#0000ff': 'royal blue',
      '#ffd700': 'metallic gold',
      '#000000': 'glossy black',
      '#00ff00': 'lime green',
      '#ff8800': 'orange',
      '#888888': 'silver grey',
    };
    
    const colorDesc = colorDescriptions[paintColor?.toLowerCase()] || `painted in the color ${paintColor}`;

    const accessories: string[] = [];
    if (hasBullbar) accessories.push("a front bull bar / brush guard");
    if (hasBeacons) accessories.push("amber rotating beacons on the roof");
    if (hasLightBar) accessories.push("an LED light bar on top");
    if (hasXenon) accessories.push("bright xenon headlights");
    if (hasSpoiler) accessories.push("a rear spoiler");

    const accessoryText = accessories.length > 0 
      ? `The vehicle is equipped with: ${accessories.join(", ")}.` 
      : "";

    const prompt = `Create a photorealistic studio photograph of ${vehicleName}, ${colorDesc} paint finish, shot from a 3/4 front angle. The vehicle is on a clean dark studio background with dramatic lighting. ${accessoryText} Ultra-detailed, professional automotive photography style, high resolution, sharp focus. No text, no watermarks, no logos.`;

    console.log("Generating vehicle with prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          { role: "user", content: prompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
