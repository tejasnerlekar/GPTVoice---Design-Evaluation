/**
 * Client Voice & Assistant Service
 * Tailored specifically to the 7-question Vedic Astrology questionnaire with
 * instant astronomical chart calculations and server-side Gemini backup.
 */

import {
  BirthDetails,
  calculateVedicChart,
  extractBirthDetails,
  isAstrologyIntent,
  VedicChartResult,
  detectQuestionnaireTopic,
  analyzeMarriageTiming,
  analyzeLoveVsArranged,
  analyzeSpousePersonality,
  analyzeJobVsBusiness,
  analyzeForeignSettlement,
} from './vedicEngine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAstrology?: boolean;
  chartData?: VedicChartResult;
}

export interface AssistantResponse {
  text: string;
  chartData?: VedicChartResult;
  partialBirthDetails?: BirthDetails;
  isAstrology: boolean;
}

export async function generateAssistantResponse(
  userPrompt: string,
  history: ChatMessage[],
  collectedBirthDetails?: BirthDetails,
  version: 'v1' | 'v2' = 'v1'
): Promise<AssistantResponse> {
  const cleanLower = userPrompt.trim().toLowerCase();

  // Handle immediate spoken pause/wait commands
  if (/^(stop|wait|hold on|pause|listen|one second|wait a second|wait a minute|shh)\b/i.test(cleanLower) && cleanLower.split(' ').length <= 4) {
    return {
      text: "I'm listening. Take your time, go ahead whenever you're ready.",
      isAstrology: false,
    };
  }

  const topic = detectQuestionnaireTopic(userPrompt);
  const extracted = extractBirthDetails(userPrompt);

  // 1. Q1: Greeting and Hello (only if not sharing birth details)
  if (topic === 'greeting' && !extracted.date && !extracted.place && !extracted.time) {
    return {
      text: "Namaste and hello! How are you doing today? I am your Vedic Astrologer, ready to calculate your Kundali and provide deep Jyotish insights into your marriage, partner, career, and life settlement whenever you are ready.",
      isAstrology: false,
    };
  }

  // 2. Q2: Role Assigning command ("I have few questions, I want you to be my Astrologer. Tell me what details you want, make my kundali...")
  if (topic === 'role_assign' && (!extracted.date || !extracted.time || !extracted.place)) {
    return {
      text: "I would be honored to be your Vedic astrologer. To construct your accurate Kundali and calculate your planetary dashas, I need three essential details: your Date of Birth, your exact Time of Birth specifying AM or PM, and your Place of Birth (city and country). Whenever you are ready, please share them with me.",
      isAstrology: true,
      chartData: undefined,
    };
  }

  // Merge newly extracted details with previously saved details
  const mergedDetails: BirthDetails = {
    date: extracted.date || collectedBirthDetails?.date || '',
    time: extracted.time || collectedBirthDetails?.time || '',
    isPM: extracted.isPM ?? collectedBirthDetails?.isPM,
    place: extracted.place || collectedBirthDetails?.place || '',
  };

  const hasDate = Boolean(mergedDetails.date);
  const hasTime = Boolean(mergedDetails.time);
  const hasPlace = Boolean(mergedDetails.place);
  const isComplete = hasDate && hasTime && hasPlace;

  // Compute Vedic Kundali ONLY when all three essential coordinates are present
  let chartData: VedicChartResult | undefined;
  if (isComplete) {
    chartData = calculateVedicChart(mergedDetails);
  }

  // If user provided partial details, acknowledge what is saved and ask for the rest
  const providedNewDetail = Boolean(extracted.date || extracted.time || extracted.place);
  if (providedNewDetail && !isComplete) {
    let promptText = '';
    if (hasDate && hasTime && !hasPlace) {
      promptText = `I have noted your date of birth as ${mergedDetails.date} at ${mergedDetails.time} ${mergedDetails.isPM ? 'PM' : 'AM'}. Which city and country were you born in so I can determine your exact geographical coordinates and calculate your Lagna?`;
    } else if (hasDate && hasPlace && !hasTime) {
      promptText = `Got it, born on ${mergedDetails.date} in ${mergedDetails.place}. What was your exact time of birth, specifying AM or PM, so I can establish your rising sign and houses accurately?`;
    } else if (hasDate && !hasTime && !hasPlace) {
      promptText = `I have recorded your date of birth as ${mergedDetails.date}. To calculate your complete Vedic Kundali and Vimshottari Dasha, please also share your exact time of birth (with AM or PM) and your place of birth.`;
    } else {
      promptText = `Thank you. I have recorded your ${mergedDetails.place ? `birth place as ${mergedDetails.place}` : ''}${mergedDetails.place && mergedDetails.time ? ' and ' : ''}${mergedDetails.time ? `time as ${mergedDetails.time} ${mergedDetails.isPM ? 'PM' : 'AM'}` : ''}. What is your Date of Birth so I can begin constructing your natal chart?`;
    }

    return {
      text: promptText,
      partialBirthDetails: mergedDetails,
      isAstrology: true,
    };
  }

  // 2. Q3: Will I ever get married and around what time?
  if (topic === 'marriage_timing') {
    if (!chartData) {
      return {
        text: "I would be delighted to analyze your marriage prospects and wedding timing! To examine your seventh house of matrimony and calculate your active Vimshottari Dasha, please provide your complete birth details: your Date of Birth, Time of Birth with AM or PM, and Place of Birth.",
        isAstrology: true,
      };
    }
    return {
      text: analyzeMarriageTiming(chartData),
      chartData,
      isAstrology: true,
    };
  }

  // 3. Q4: Love marriage vs. Arranged marriage possibilities
  if (topic === 'love_vs_arranged') {
    if (!chartData) {
      return {
        text: "To evaluate whether your Kundali favors a love marriage or an arranged family alliance, I need to analyze the connection between your fifth and seventh houses. Please share your Date of Birth, exact Time of Birth with AM or PM, and Place of Birth to begin.",
        isAstrology: true,
      };
    }
    return {
      text: analyzeLoveVsArranged(chartData),
      chartData,
      isAstrology: true,
    };
  }

  // 4. Q5: Personality of future partner
  if (topic === 'partner_personality') {
    if (!chartData) {
      return {
        text: "To reveal the detailed personality, character, and disposition of your future life partner, I must calculate your seventh house ruler and planetary aspects. Please provide your Date of Birth, Time of Birth with AM or PM, and Place of Birth.",
        isAstrology: true,
      };
    }
    return {
      text: analyzeSpousePersonality(chartData),
      chartData,
      isAstrology: true,
    };
  }

  // 5. Q6: Success in Job vs. Business
  if (topic === 'job_vs_business') {
    if (!chartData) {
      return {
        text: "To determine whether your Kundali shows greater financial prosperity and authority in a corporate job or an independent business venture, please provide your Date of Birth, Time of Birth with AM or PM, and Place of Birth so I can analyze your sixth, tenth, and eleventh houses.",
        isAstrology: true,
      };
    }
    return {
      text: analyzeJobVsBusiness(chartData),
      chartData,
      isAstrology: true,
    };
  }

  // 6. Q7: Settle in India vs. Abroad
  if (topic === 'settlement') {
    if (!chartData) {
      return {
        text: "To analyze whether your destiny lies in settling comfortably in India or building your home abroad in foreign lands, please share your Date of Birth, Time of Birth with AM or PM, and Place of Birth so I can calculate your fourth, ninth, and twelfth houses.",
        isAstrology: true,
      };
    }
    return {
      text: analyzeForeignSettlement(chartData),
      chartData,
      isAstrology: true,
    };
  }

  // 7. If user just shared complete birth details OR asked to make Kundali with details:
  if (chartData && (providedNewDetail || topic === 'role_assign' || topic === 'other')) {
    return {
      text: chartData.readingText,
      chartData,
      isAstrology: true,
    };
  }

  // 8. General Astrology Intent without details yet
  if (topic === 'role_assign' || isAstrologyIntent(userPrompt)) {
    return {
      text: "I would be honored to be your Vedic astrologer. To construct your accurate Kundali and calculate your planetary dashas, I need three essential details: your Date of Birth, your exact Time of Birth specifying AM or PM, and your Place of Birth (city and country). Whenever you are ready, please share them with me.",
      isAstrology: true,
      chartData: undefined,
    };
  }

  // 9. Fallback: If query is general or outside the 7-questionnaire scope, invoke server Gemini
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('/api/chatgpt/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        userPrompt,
        history: history.slice(-3).map((h) => ({ role: h.role, content: h.content })),
        chartData,
        isAstrology: isAstrologyIntent(userPrompt) || !!chartData,
        version,
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        return {
          text: data.text.trim(),
          chartData,
          isAstrology: isAstrologyIntent(userPrompt) || !!chartData,
        };
      }
    }
  } catch (err) {
    console.debug('Server call notice, using local handler:', err);
  }

  // Default response
  if (chartData) {
    return { text: chartData.readingText, chartData, isAstrology: true };
  }
  return {
    text: "I am ready to guide you through your Vedic astrology questions regarding marriage, career, and life settlement. Please share your birth date, time, and place to begin.",
    isAstrology: false,
  };
}
