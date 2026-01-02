import { GoogleGenAI } from "@google/genai";
import { DeliveryEstimate, AnalysisResponse, PlatformName } from "../types";
import { PLATFORM_COLORS, AVG_RIDER_SPEED_KMPH, PACKING_TIME_MIN } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to calculate time based on distance
const calculateTimeAndFeasibility = (distanceKm: number) => {
  const travelTime = (distanceKm / AVG_RIDER_SPEED_KMPH) * 60;
  const totalTime = Math.round(travelTime + PACKING_TIME_MIN);

  let feasibility: 'Highly Feasible' | 'Borderline' | 'Unlikely' = 'Unlikely';
  if (totalTime < 10) feasibility = 'Highly Feasible';
  else if (totalTime <= 15) feasibility = 'Borderline';

  return { totalTime, feasibility };
};

export const discoverStores = async (
  locationQuery: string
): Promise<DeliveryEstimate[]> => {
  try {
    // We use the Google Maps tool for precise location finding
    const prompt = `
      You are a geospatial analyst.
      User Location: "${locationQuery}"

      Task: Find the nearest operating location for EACH of these Quick Commerce platforms relative to the User Location:
      1. Zepto
      2. Blinkit
      3. Swiggy Instamart

      Use Google Maps to find these specific business listings. Look for terms like "Zepto", "Blinkit Store", "Swiggy Instamart", "Instamart", or "Grocery Delivery Hub".
      
      For each platform:
      1. Identify the nearest location found on Maps.
      2. Calculate/Estimate the driving distance (in KM) from "${locationQuery}" to that store.
      
      Output strictly a valid JSON array string. Do not use Markdown code blocks.
      Schema:
      [
        {
          "platform": "Zepto",
          "found": true,
          "storeName": "Name from Maps",
          "storeAddress": "Address from Maps",
          "distanceKm": 1.5
        }
      ]
      
      If a platform is not found nearby, set "found": false and "distanceKm": 0.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        // responseMimeType is NOT allowed with googleMaps tool
      }
    });

    const text = response.text || "[]";
    
    // Parse JSON manually since we couldn't enforce MIME type
    let rawData: any[] = [];
    try {
      // Extract array from text (handling potential markdown wrappers)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rawData = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("No JSON array found in response text", text);
      }
    } catch (e) {
      console.error("Failed to parse AI response", e);
    }

    // Extract Maps Grounding Metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let evidenceMap: Record<string, string> = {};
    
    // Map grounding chunks to platforms based on title match
    chunks.forEach((chunk: any) => {
      // Maps grounding usually returns 'web' or 'maps'
      const mapData = chunk.maps || chunk.web; 
      if (mapData?.uri) {
        const title = (mapData.title || "").toLowerCase();
        const uri = mapData.uri;
        
        if (title.includes('zepto')) evidenceMap['Zepto'] = uri;
        if (title.includes('blinkit')) evidenceMap['Blinkit'] = uri;
        if (title.includes('swiggy') || title.includes('instamart')) evidenceMap['Swiggy Instamart'] = uri;
      }
    });

    const platforms: PlatformName[] = ['Zepto', 'Blinkit', 'Swiggy Instamart'];
    
    const estimates: DeliveryEstimate[] = platforms.map(platform => {
      const foundData = rawData.find((d: any) => d.platform === platform && d.found);
      
      // If AI didn't find it but we have a map link that clearly says the platform name, 
      // we might want to trust the map link, but for now strictly follow the JSON output logic.
      
      if (foundData) {
        const { totalTime, feasibility } = calculateTimeAndFeasibility(foundData.distanceKm);
        
        // Prefer the specific link found for this item if possible, otherwise fallback to category match
        const specificLink = evidenceMap[platform]; 

        return {
          platform,
          storeName: foundData.storeName,
          storeAddress: foundData.storeAddress,
          distanceKm: foundData.distanceKm,
          estimatedTravelTimeMin: totalTime,
          feasibility,
          color: PLATFORM_COLORS[platform],
          source: 'Live Search',
          evidenceLink: specificLink
        };
      } else {
        return {
          platform,
          storeName: 'No listed hub found nearby',
          storeAddress: 'N/A',
          distanceKm: 0,
          estimatedTravelTimeMin: 0,
          feasibility: 'Unknown',
          color: '#cbd5e1', // Grey
          source: 'Not Found'
        };
      }
    });

    return estimates;

  } catch (error) {
    console.error("Maps Service Error:", error);
    return [];
  }
};

export const analyzeFeasibility = async (
  location: string,
  estimates: DeliveryEstimate[]
): Promise<AnalysisResponse> => {
  try {
    const validEstimates = estimates.filter(e => e.source !== 'Not Found');
    
    if (validEstimates.length === 0) {
      return {
        summary: "Google Maps could not pinpoint specific dark stores listed publicly near this location. However, delivery might still be available from further hubs.",
        riskFactors: ["Hidden/Unlisted dark stores", "Potential long-distance routing"]
      };
    }

    const estimatesJson = JSON.stringify(validEstimates);
    const prompt = `
      Analyze these delivery logistics for a user at "${location}".
      Data: ${estimatesJson}
      
      Context: <10m is Highly Feasible, 10-15m Borderline, >15m Unlikely.
      
      Task:
      1. Summary (max 60 words): Is 10-min delivery realistic?
      2. 3 Risk Factors.
      
      Output JSON: { "summary": string, "riskFactors": string[] }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text!) as AnalysisResponse;

  } catch (error) {
    return {
      summary: "Analysis unavailable.",
      riskFactors: []
    };
  }
};