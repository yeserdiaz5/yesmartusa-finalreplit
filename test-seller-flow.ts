import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testSellerFlow() {
  console.log("🧪 Testing seller flow...")
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // 1. Login with test user
  console.log("\n1️⃣ Logging in with test user...")
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "test@yesmartusa.com",
    password: "TestUser123!"
  })
  
  if (authError) {
    console.error("❌ Login failed:", authError.message)
    return
  }
  
  console.log("✅ Logged in as:", authData.user?.email)
  
  // 2. Get user data
  console.log("\n2️⃣ Getting user data...")
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single()
  
  if (userError) {
    console.error("❌ User data fetch failed:", userError.message)
    return
  }
  
  console.log("✅ User data:", {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    stripe_account_verified: userData.stripe_account_verified,
    stripe_connect_account_id: userData.stripe_connect_account_id
  })
  
  // 3. Test accessing /seller/pagos endpoint
  console.log("\n3️⃣ Testing /seller/pagos access...")
  
  const response = await fetch("http://localhost:5000/seller/pagos", {
    headers: {
      "Cookie": `sb-access-token=${authData.session?.access_token}; sb-refresh-token=${authData.session?.refresh_token}`
    }
  })
  
  console.log("Response status:", response.status)
  console.log("Response redirected:", response.redirected)
  console.log("Response URL:", response.url)
  
  if (response.status === 200) {
    console.log("✅ /seller/pagos accessible")
  } else {
    console.log("❌ /seller/pagos NOT accessible - Status:", response.status)
  }
  
  // 4. Test calling stripe-onboarding API
  console.log("\n4️⃣ Testing Stripe onboarding API...")
  
  const onboardingResponse = await fetch("http://localhost:5000/api/stripe-onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `sb-access-token=${authData.session?.access_token}; sb-refresh-token=${authData.session?.refresh_token}`
    }
  })
  
  const onboardingData = await onboardingResponse.json()
  
  if (onboardingResponse.ok && onboardingData.success) {
    console.log("✅ Stripe onboarding API works!")
    console.log("Stripe URL:", onboardingData.url)
  } else {
    console.log("❌ Stripe onboarding API failed:", onboardingData)
  }
}

testSellerFlow().catch(console.error)
