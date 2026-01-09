# 🧪 Local Testing Guide

## Server Status
✅ **Server running at:** http://localhost:3001

---

## Test Plan

### ✅ Step 1: Test the Travel Agent Demo

1. **Open the app** (already opened in your browser)
   - URL: http://localhost:3001

2. **Navigate to Demo tab**
   - Click "Demo" in the navigation

3. **Enter a test User ID**
   - Use: `test_user_new_structure`
   - This ensures we don't mix with old data

4. **Have a conversation** about travel:
   ```
   Example conversation:
   
   You: "I'm planning a trip to Japan. I'm vegetarian and I love photography. My budget is around $5000."
   
   Agent: [Will respond with travel suggestions]
   
   You: "I prefer morning flights because I sleep better on planes."
   
   Agent: [Will respond]
   
   You: "I went to Paris last year and loved it. Rated it 5/5."
   ```

5. **Check the browser console** (F12 → Console tab)
   - Should see no errors
   - Should see successful API calls

---

### ✅ Step 2: Verify Short-Term Memory Storage

**Check that messages are stored with the new structure:**

```bash
# In a new terminal, check Redis (Upstash Console)
# Or use the API:

curl "http://localhost:3001/api/memory/short-term/retrieve?session_id=SESSION_ID"
```

**Expected format:**
```json
{
  "messages": [
    {
      "user_id": "test_user_new_structure",
      "session_id": "...",
      "role": "user",
      "text": "I'm planning a trip to Japan...",
      "timestamp": "..."
    },
    {
      "user_id": "test_user_new_structure",
      "session_id": "...",
      "role": "agent",
      "text": "Great choice! Japan is...",
      "timestamp": "..."
    }
  ]
}
```

---

### ✅ Step 3: Trigger Memory Extraction

**Run the cron job manually:**

```bash
curl -X POST http://localhost:3001/api/cron/extract-memories \
  -H "Authorization: Bearer agent-memory-hub-secret-2024"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "sessions_processed": 1,
    "memories_extracted": 3,
    "errors": []
  }
}
```

---

### ✅ Step 4: Verify Long-Term Memory Extraction

**Check that memories were categorized correctly:**

```bash
curl "http://localhost:3001/api/memory/long-term/retrieve?user_id=test_user_new_structure&service_id=travel-agent-example"
```

**Expected buckets:**

1. **generic_memory** (unstructured):
   ```json
   {
     "generic_memory": [
       {
         "text": "User loves photography",
         "timestamp": "..."
       },
       {
         "text": "User prefers morning flights because they sleep better on planes",
         "timestamp": "..."
       }
     ]
   }
   ```

2. **preferences** (structured):
   ```json
   {
     "preferences": [
       {
         "budget_range": "$5000",
         "dietary_restrictions": ["vegetarian"]
       }
     ]
   }
   ```

3. **facts** (structured):
   ```json
   {
     "facts": [
       {
         "fact_type": "interest",
         "fact_value": "photography"
       }
     ]
   }
   ```

4. **past_trips** (structured):
   ```json
   {
     "past_trips": [
       {
         "destination": "Paris",
         "trip_dates": "last year",
         "rating": 5
       }
     ]
   }
   ```

---

### ✅ Step 5: Test Memory Recall

**Start a NEW conversation with the same User ID:**

1. Refresh the page or clear the chat
2. Use the same User ID: `test_user_new_structure`
3. Ask: "What do you know about me?"

**Expected:**
- Agent should mention your vegetarian diet
- Agent should mention your photography interest
- Agent should mention your Paris trip
- Agent should mention your morning flight preference

---

## 🐛 Troubleshooting

### Issue: "Service not found"
- Make sure the Travel Agent example service exists
- Check Dashboard → should see "Travel Planning Agent"

### Issue: "OpenAI API error"
- Check your `.env.local` file has `OPENAI_API_KEY`
- Restart the server after adding the key

### Issue: No memories extracted
- Check the cron job response for errors
- Verify the conversation was stored in short-term memory
- Check browser console for API errors

### Issue: Old data format in Redis
- Clear Redis keys for the test user:
  - Go to Upstash Console → Data Browser
  - Delete keys matching `user:test_user_new_structure:*`

---

## ✅ Success Criteria

- [ ] Chat works without errors
- [ ] Messages stored with `role` and `text` fields
- [ ] Cron job extracts memories successfully
- [ ] Memories categorized into correct buckets
- [ ] Unstructured bucket (`generic_memory`) contains free-form text
- [ ] Structured buckets contain properly formatted data
- [ ] Next conversation recalls previous memories

---

## 📝 Notes

- Session ID is auto-generated (check browser console or network tab)
- Memories are extracted every 5 minutes in production (manual trigger for testing)
- Each message (user + agent) is stored separately now

---

**Happy Testing!** 🚀

If you encounter any issues, check the browser console and terminal logs.

