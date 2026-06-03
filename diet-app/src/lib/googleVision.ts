// Heuristiken für Gewichtsschätzung basierend auf Google Vision API

interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: {
    vertices: Array<{ x: number; y: number }>;
  };
}

interface VisionResponse {
  localizedObjectAnnotations?: DetectedObject[];
  textAnnotations?: Array<{ description: string }>;
  error?: {
    code: number;
    message: string;
  };
}

// Durchschnittliche Gewichte für häufige Lebensmittel (in Gramm)
const FOOD_WEIGHTS: Record<string, number> = {
  apple: 182,
  banana: 118,
  orange: 131,
  lemon: 58,
  lime: 47,
  grape: 5,
  strawberry: 12,
  blueberry: 2,
  bread: 30, // pro Scheibe
  slice: 30,
  egg: 50,
  chicken: 165,
  fish: 150,
  beef: 150,
  salad: 100,
  rice: 165, // gekocht
  pasta: 220, // gekocht
  potato: 173,
  carrot: 61,
  tomato: 123,
  cucumber: 301,
  milk: 244, // 240ml glass
  yogurt: 227,
  cheese: 28, // 1 oz
  butter: 14,
  oil: 14,
};

function estimateWeightFromObject(object: DetectedObject): number {
  const name = object.name.toLowerCase();

  // Versuche direkten Match
  if (FOOD_WEIGHTS[name]) {
    return FOOD_WEIGHTS[name];
  }

  // Versuche teilweisen Match
  for (const [key, weight] of Object.entries(FOOD_WEIGHTS)) {
    if (name.includes(key) || key.includes(name)) {
      return weight;
    }
  }

  // Fallback: Schätze basierend auf Bounding Box Größe
  const { vertices } = object.boundingBox;
  if (vertices && vertices.length >= 2) {
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[0].y);
    const area = width * height;
    // Grobe Heuristik: größere Objekte sind schwerer
    // Normalisiert auf 0-500g Range
    return Math.min(500, Math.max(20, area * 0.5));
  }

  // Standard fallback
  return 100;
}

export async function estimateWeightFromImage(
  imageBase64: string,
  apiKey: string,
): Promise<{ weight: number; confidence: 'low' | 'medium' | 'high' }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API-Key erforderlich');
  }

  const url =
    'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey;

  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64.replace(/^data:image\/(png|jpeg);base64,/, ''),
        },
        features: [
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'TEXT_DETECTION' },
        ],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || `API Error: ${response.statusText}`,
      );
    }

    const data: { responses: VisionResponse[] } = await response.json();

    if (data.responses[0]?.error) {
      throw new Error(data.responses[0].error.message);
    }

    const objects = data.responses[0]?.localizedObjectAnnotations || [];

    if (objects.length === 0) {
      // Fallback: Nutzer soll manuel eingeben
      return { weight: 100, confidence: 'low' };
    }

    // Nutze das Objekt mit höchstem Confidence
    const mainObject = objects[0];
    let weight = estimateWeightFromObject(mainObject);

    // Adjustiere basierend auf Größe relativ zum Bild
    // (größere Bounding Box = wahrscheinlich näher zur Kamera = potenziell schwerer)
    if (mainObject.boundingBox?.vertices) {
      const vertices = mainObject.boundingBox.vertices;
      const boxWidth = Math.abs(vertices[1].x - vertices[0].x);
      const boxHeight = Math.abs(vertices[2].y - vertices[0].y);
      const boxArea = boxWidth * boxHeight;

      // Wenn das Objekt ein großer Teil des Bildes ist, erhöhe das Gewicht
      if (boxArea > 0.3) {
        // 30% des Bildes
        weight = weight * 1.3;
      } else if (boxArea < 0.05) {
        // Weniger als 5% des Bildes
        weight = weight * 0.8;
      }
    }

    // Confidence basierend auf Anzahl der erkannten Objekte
    // Wenn nur 1 Objekt: hoch
    // Wenn mehrere: mittel (schwerer zu schätzen)
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (objects.length === 1 && mainObject.confidence > 0.8) {
      confidence = 'high';
    } else if (objects.length > 3 || mainObject.confidence < 0.6) {
      confidence = 'low';
    }

    weight = Math.max(10, Math.min(500, Math.round(weight)));

    return { weight, confidence };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    throw new Error(`Gewichtsschätzung fehlgeschlagen: ${message}`);
  }
}

export function getConfidenceTolerancePercent(confidence: string): number {
  switch (confidence) {
    case 'high':
      return 3;
    case 'medium':
      return 5;
    case 'low':
      return 10;
    default:
      return 5;
  }
}
