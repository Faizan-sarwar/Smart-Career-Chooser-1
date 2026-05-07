import Groq from "groq-sdk";

// Initialize Groq using your existing .env key!

// CACHING VARIABLES: Protects your API limits
let cachedMarketData = null;
let lastFetchTime = null;

export const getMarketInsights = async (req, res, next) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    // 1. CHECK CACHE (If data is less than 24 hours old, send it instantly!)
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    if (cachedMarketData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      console.log("Serving Market Data from Cache");
      return res.json(cachedMarketData);
    }

    console.log("Fetching fresh Market Data from Groq (Llama 3)...");
    const currentYear = new Date().getFullYear();

    // 2. THE MASTER PROMPT
    const prompt = `
      You are an expert labor market analyst for Pakistan in ${currentYear}. 
      Generate realistic, highly accurate tech career market data.
      Return ONLY a valid JSON object matching this exact structure perfectly. Do not include markdown formatting or any text outside the JSON.
      
      {
        "ticker": ["String 1 (e.g. AI roles up 40%)", "String 2", "String 3"],
        "stats": {
          "openRoles": { "value": "Number (e.g. 15.2K)", "delta": "String (e.g. +12% YoY)", "spark": [10, 12, 13, 14, 15] },
          "avgSalary": { "value": "String (e.g. PKR 2.4M)", "delta": "String (e.g. +18% YoY)", "spark": [1.8, 2.0, 2.1, 2.3, 2.4] },
          "remoteShare": { "value": "Percentage (e.g. 38%)", "delta": "String (e.g. +4% MoM)", "spark": [30, 32, 35, 36, 38] },
          "topGrowth": { "value": "String (e.g. AI Engineering)", "delta": "String (e.g. +142%)", "spark": [10, 25, 45, 80, 142] }
        },
        "salaryCategories": [
          { "name": "AI & Data", "color": "#7c3aed" },
          { "name": "Software", "color": "#0d9488" },
          { "name": "Cyber", "color": "#dc2626" },
          { "name": "Cloud", "color": "#0891b2" },
          { "name": "Design", "color": "#f97316" }
        ],
        "salaryYears": [
          { "year": "${currentYear - 4}", "AI & Data": 10, "Software": 12, "Cyber": 11, "Cloud": 13, "Design": 8 },
          { "year": "${currentYear - 3}", "AI & Data": 13, "Software": 14, "Cyber": 13, "Cloud": 15, "Design": 9 },
          { "year": "${currentYear - 2}", "AI & Data": 16, "Software": 16, "Cyber": 16, "Cloud": 18, "Design": 11 },
          { "year": "${currentYear - 1}", "AI & Data": 19, "Software": 17, "Cyber": 18, "Cloud": 21, "Design": 13 },
          { "year": "${currentYear}", "AI & Data": 23, "Software": 19, "Cyber": 22, "Cloud": 25, "Design": 14 }
        ],
        "topSkills": [
          { "skill": "Skill 1", "demand": 95 },
          { "skill": "Skill 2", "demand": 88 },
          { "skill": "Skill 3", "demand": 82 },
          { "skill": "Skill 4", "demand": 75 },
          { "skill": "Skill 5", "demand": 68 },
          { "skill": "Skill 6", "demand": 60 }
        ],
        "trendingCareers": [
          { "title": "Career 1", "growth": "+XX%", "color": "#0d9488" },
          { "title": "Career 2", "growth": "+XX%", "color": "#7c3aed" },
          { "title": "Career 3", "growth": "+XX%", "color": "#f97316" },
          { "title": "Career 4", "growth": "+XX%", "color": "#dc2626" }
        ]
      }
    `;

    // 3. CALL GROQ API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a JSON-only API. You output nothing except strict JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant", // Fast, accurate open-source model!
      response_format: { type: "json_object" }, // Forces perfect JSON output
      temperature: 0.7,
    });

    // 4. PARSE AND CACHE
    const liveData = JSON.parse(chatCompletion.choices[0].message.content);

    cachedMarketData = liveData;
    lastFetchTime = Date.now();

    // 5. SEND TO REACT
    res.json(liveData);

  } catch (error) {
    console.error("Groq Generation failed:", error);
    next(error);
  }
};