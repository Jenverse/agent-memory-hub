# Service Selector Update

## ✅ What Was Fixed

### **Problem:**
The Travel Agent Demo was **hardcoded** to use `"travel-agent-example"` service. You couldn't test other memory services.

### **Solution:**
Added a **dropdown selector** to choose which memory service the demo should use.

---

## 🎯 Changes Made

### **1. Added Service Selection UI**
- **Dropdown** to select from all available services
- Shows service name and purpose
- Auto-selects "Travel Planning Agent" if available, or first service

### **2. Dynamic Service Loading**
- Fetches all services from `/api/services/list`
- Updates when you create new services
- Shows loading state while fetching

### **3. Connected to Memory System**
- Selected service is used for:
  - Loading long-term memories
  - Storing short-term messages (user + agent)
  - Memory extraction (via cron job)

---

## 🖼️ What You'll See

### **New UI in Demo Tab:**

```
┌─────────────────────────────────────────┐
│ 🗄️ Memory Service                       │
│ ┌─────────────────────────────────────┐ │
│ │ Travel Planning Agent            ▼  │ │
│ └─────────────────────────────────────┘ │
│ Help users plan personalized trips...   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👤 User ID                              │
│ ┌─────────────────────────────────────┐ │
│ │ test_user_123                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📋 How to Use

### **1. Open the Demo**
- Go to http://localhost:3001
- Click **"Demo"** tab

### **2. Select Your Service**
- Click the **"Memory Service"** dropdown
- You'll see all your configured services:
  - Travel Planning Agent
  - Shopping Assistant
  - Productivity Assistant
  - (Any custom services you created)

### **3. Choose Which One to Test**
- Select the service you want to test
- The description will show below the dropdown
- This determines which memory buckets are used

### **4. Enter User ID and Chat**
- Enter a user ID (e.g., `test_user_travel`)
- Start chatting!
- Memories will be stored in the selected service's buckets

---

## 🧪 Testing Different Services

### **Test Travel Agent:**
1. Select: **"Travel Planning Agent"**
2. User ID: `test_user_travel`
3. Chat: "I want to visit Japan. I'm vegetarian and love photography."
4. Memories go to: `generic_memory`, `preferences`, `facts`, `past_trips`

### **Test Shopping Assistant:**
1. Select: **"Shopping Assistant"**
2. User ID: `test_user_shopping`
3. Chat: "I'm looking for running shoes. I prefer Nike and my budget is $150."
4. Memories go to: `purchase_history`, `product_preferences`, `wishlist_tracking`

### **Test Productivity Assistant:**
1. Select: **"Productivity Assistant"**
2. User ID: `test_user_productivity`
3. Chat: "I'm working on a project due next Friday. I work best in the mornings."
4. Memories go to: `work_preferences`, `project_context`, `communication_style`

---

## 🔍 How It Works

### **Service Selection Flow:**

```
1. Demo loads → Fetches all services from API
2. User selects service from dropdown
3. User enters User ID
4. User chats with agent
5. Messages stored with selected service_id
6. Cron job extracts memories using service's schema
7. Next conversation loads memories from that service
```

### **Code Changes:**

**Before:**
```typescript
// Hardcoded
const serviceId = "travel-agent-example";
```

**After:**
```typescript
// Dynamic
const [selectedServiceId, setSelectedServiceId] = useState("");
const [availableServices, setAvailableServices] = useState([]);

// Fetch services
useEffect(() => {
  const response = await serviceAPI.list();
  setAvailableServices(response.data);
}, []);
```

---

## 💡 Benefits

1. **Test Multiple Services** - Switch between services without code changes
2. **Clear Visibility** - See which service you're testing
3. **Flexible** - Add new services and test immediately
4. **User-Friendly** - No need to know service IDs

---

## 🎯 Next Steps

1. **Refresh your browser** at http://localhost:3001
2. **Go to Demo tab**
3. **See the new dropdown** at the top
4. **Select a service** and start testing!

---

## 📝 Files Modified

- ✅ `src/components/TravelAgentDemo.tsx` - Added service selector UI and logic

---

**Now you can test all your memory services!** 🚀

