# Travel Agent System Prompt & Memory Guide

## 🎭 System Prompt for Travel Agent

```
You are a knowledgeable and enthusiastic travel planning assistant. Your role is to help users plan personalized trips based on their preferences, past experiences, and travel companions.

Your responsibilities:
- Provide detailed, personalized travel itineraries
- Recommend destinations, activities, accommodations, and dining options
- Consider user's budget, dietary restrictions, and travel preferences
- Remember past trips and use them to make better recommendations
- Be friendly, enthusiastic, and helpful
- Ask clarifying questions to better understand user needs

When planning trips:
1. Always consider the user's budget range
2. Respect dietary restrictions and preferences
3. Take into account preferred airlines and seat preferences
4. Remember what they enjoyed in past trips
5. Consider their travel companions and their needs
6. Suggest activities aligned with their interests

Be conversational and warm, but also practical and informative.
```

---

## 💾 What Memories to Store

### **Unstructured Memories** (`generic_memory`)

Store casual mentions and contextual information that doesn't fit structured categories:

**Examples:**
- "User loves trying local street food when traveling"
- "User prefers morning flights because they sleep better on planes"
- "User gets motion sickness on boats"
- "User likes to wake up early and explore before crowds arrive"
- "User mentioned they're afraid of heights"
- "User enjoys photography and wants scenic spots"
- "User prefers boutique hotels over large chains"
- "User likes to have one 'fancy' dinner per trip"
- "User mentioned they always pack light"
- "User prefers direct flights even if more expensive"

---

### **Structured Memories**

#### 1. **Preferences** (`preferences`)

Specific, repeatable preferences:

**Budget:**
- "$3000-5000 per person"
- "Budget traveler, under $2000"
- "Luxury travel, $10,000+"

**Dietary Restrictions:**
- ["vegetarian"]
- ["vegan", "gluten-free"]
- ["halal"]
- ["no seafood"]

**Preferred Airlines:**
- ["Delta", "United"]
- ["Emirates", "Qatar Airways"]

**Seat Preference:**
- "window"
- "aisle"
- "exit row"

**Accommodation Type:**
- "boutique hotels"
- "hostels"
- "all-inclusive resorts"
- "Airbnb"

---

#### 2. **Facts** (`facts`)

Factual information about the user:

**Examples:**

| fact_type | fact_value | context |
|-----------|------------|---------|
| occupation | software engineer | mentioned during work travel discussion |
| home_city | San Francisco | |
| age_range | 30-40 | |
| travel_frequency | 3-4 times per year | |
| languages_spoken | English, Spanish | |
| passport_country | USA | |
| interest | photography | loves taking photos while traveling |
| interest | hiking | enjoys outdoor activities |
| interest | art museums | mentioned multiple times |
| interest | wine tasting | |
| family_status | married with 2 kids | |
| mobility | uses wheelchair | important for accessibility |

---

#### 3. **Past Trips** (`past_trips`)

History of previous trips:

**Examples:**

```json
{
  "destination": "Paris, France",
  "trip_dates": "June 2024",
  "highlights": ["Eiffel Tower", "Louvre Museum", "Montmartre"],
  "rating": 5
}

{
  "destination": "Tokyo, Japan",
  "trip_dates": "March 2023",
  "highlights": ["Tsukiji Market", "Mount Fuji day trip", "Shibuya"],
  "rating": 5
}

{
  "destination": "Cancun, Mexico",
  "trip_dates": "December 2023",
  "highlights": ["Beach resort", "Mayan ruins"],
  "rating": 3
}

{
  "destination": "Barcelona, Spain",
  "trip_dates": "September 2022",
  "highlights": ["Sagrada Familia", "Park Güell", "Tapas tour"],
  "rating": 4
}
```

---

## 🗣️ Sample Conversations & What to Extract

### **Conversation 1:**

**User:** "I'm planning a trip to Italy. I'm vegetarian and I love art museums. My budget is around $4000."

**Extract:**
- **generic_memory:** "User loves art museums"
- **preferences:** `{ budget_range: "$4000", dietary_restrictions: ["vegetarian"] }`
- **facts:** `{ fact_type: "interest", fact_value: "art museums" }`

---

### **Conversation 2:**

**User:** "I went to Paris last year and absolutely loved it! The Louvre was incredible. I'd rate that trip a 5 out of 5."

**Extract:**
- **past_trips:** `{ destination: "Paris", trip_dates: "last year", highlights: ["Louvre"], rating: 5 }`

---

### **Conversation 3:**

**User:** "I prefer window seats on flights. I like to take photos from the plane. Also, I always fly Delta if possible."

**Extract:**
- **generic_memory:** "User likes to take photos from the plane"
- **preferences:** `{ seat_preference: "window", preferred_airlines: ["Delta"] }`
- **facts:** `{ fact_type: "interest", fact_value: "photography" }`

---

### **Conversation 4:**

**User:** "I'm traveling with my wife and two kids (ages 8 and 10). We need family-friendly activities. My wife is gluten-free."

**Extract:**
- **facts:** `{ fact_type: "family_status", fact_value: "married with 2 kids (ages 8, 10)" }`
- **preferences:** `{ dietary_restrictions: ["gluten-free"] }` (for wife)
- **generic_memory:** "User travels with wife and two kids (ages 8 and 10)"
- **generic_memory:** "Wife is gluten-free"

---

### **Conversation 5:**

**User:** "I'm from San Francisco and I work in tech. I usually take 3-4 trips per year. I love hiking and wine tasting."

**Extract:**
- **facts:** 
  - `{ fact_type: "home_city", fact_value: "San Francisco" }`
  - `{ fact_type: "occupation", fact_value: "tech worker" }`
  - `{ fact_type: "travel_frequency", fact_value: "3-4 times per year" }`
  - `{ fact_type: "interest", fact_value: "hiking" }`
  - `{ fact_type: "interest", fact_value: "wine tasting" }`

---

## 🎯 Memory Extraction Guidelines

### **Use Unstructured (`generic_memory`) for:**
- ✅ Anecdotes and stories
- ✅ Preferences too specific for structured fields
- ✅ Contextual information
- ✅ Behavioral patterns
- ✅ Emotional responses ("loved", "hated")
- ✅ Casual mentions

### **Use Structured Buckets for:**
- ✅ Repeatable data (budget, dietary restrictions)
- ✅ Information you want to query/filter
- ✅ Data with clear categories
- ✅ Information that needs validation
- ✅ Factual information (occupation, home city)

---

## 💡 Tips for Better Memory Extraction

1. **Be specific but concise** in unstructured memories
2. **Extract multiple facts** from a single sentence if applicable
3. **Update preferences** if user mentions changes
4. **Rate past trips** if user expresses satisfaction (1-5 scale)
5. **Capture context** in the facts table when relevant
6. **Don't duplicate** - if something fits structured, don't also put in unstructured

---

## 🧪 Test Conversation

Try this conversation to test all memory types:

```
User: "Hi! I'm planning a trip to Japan. I'm vegetarian and I love photography 
and hiking. My budget is around $5000. I prefer morning flights because I sleep 
better on planes. I went to Paris last year and loved it - especially the Louvre 
and Montmartre. I'd rate that trip a 5 out of 5. I'm from Seattle and work as 
a software engineer. I usually take 3-4 trips per year."

Agent: [Responds with Japan recommendations]

User: "That sounds great! I prefer window seats so I can take photos. I always 
fly with Delta if possible. Also, I should mention I'm traveling with my wife, 
who is gluten-free."
```

**Expected Extraction:**

**generic_memory:**
- "User loves photography and hiking"
- "User prefers morning flights because they sleep better on planes"
- "User likes to take photos from plane window"
- "User traveling with wife who is gluten-free"

**preferences:**
- budget_range: "$5000"
- dietary_restrictions: ["vegetarian", "gluten-free"]
- preferred_airlines: ["Delta"]
- seat_preference: "window"

**facts:**
- { fact_type: "home_city", fact_value: "Seattle" }
- { fact_type: "occupation", fact_value: "software engineer" }
- { fact_type: "travel_frequency", fact_value: "3-4 times per year" }
- { fact_type: "interest", fact_value: "photography" }
- { fact_type: "interest", fact_value: "hiking" }
- { fact_type: "family_status", fact_value: "married" }

**past_trips:**
- { destination: "Paris", trip_dates: "last year", highlights: ["Louvre", "Montmartre"], rating: 5 }

---

**Use this as your testing conversation!** 🚀

