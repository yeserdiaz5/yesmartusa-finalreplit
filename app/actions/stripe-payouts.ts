"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

/**
 * Obtiene o crea la cuenta de Stripe Connect para un vendedor
 */
export async function getOrCreateStripeAccount(userId: string, email: string) {
  const supabase = await createClient()

  // Verificar si ya tiene una cuenta de Stripe Connect
  const { data: existingAccount } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (existingAccount && existingAccount.stripe_connect_account_id) {
    return {
      success: true,
      accountId: existingAccount.stripe_connect_account_id,
      onboardingCompleted: existingAccount.stripe_account_verified,
    }
  }

  // Crear nueva cuenta de Stripe Connect
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    // Guardar en la base de datos
    const { error: updateError } = await supabase
      .from("users")
      .update({
        stripe_connect_account_id: account.id,
        stripe_account_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[v0] Error saving Stripe account:", updateError)
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      accountId: account.id,
      onboardingCompleted: false,
    }
  } catch (error: any) {
    console.error("[v0] Error creating Stripe Connect account:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Crea un link de onboarding para que el vendedor complete su configuración de Stripe
 */
export async function createStripeAccountLink(accountId: string) {
  try {
    // Use Replit public URL or configured redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
                    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000")
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/seller/pagos`,
      return_url: `${baseUrl}/seller/pagos?setup=complete`,
      type: "account_onboarding",
    })

    return { success: true, url: accountLink.url }
  } catch (error: any) {
    console.error("[v0] Error creating account link:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Marca la cuenta como completada después del onboarding
 */
export async function markAccountOnboardingComplete(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("users")
    .update({
      stripe_account_verified: true,
      stripe_account_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("[v0] Error marking onboarding complete:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Obtiene el balance actual de Stripe del vendedor
 */
export async function getStripeBalance() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    // Obtener cuenta de Stripe del vendedor
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!userData || !userData.stripe_account_verified || !userData.stripe_connect_account_id) {
      return {
        success: false,
        error: "Necesitas completar la configuración de tu cuenta de Stripe",
        needsOnboarding: true,
      }
    }

    // Obtener balance de Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: userData.stripe_connect_account_id,
    })

    const availableBalance = balance.available[0]?.amount || 0
    const pendingBalance = balance.pending[0]?.amount || 0
    const currency = balance.available[0]?.currency || "usd"

    return {
      success: true,
      data: {
        available: availableBalance / 100, // Convertir de centavos a dólares
        pending: pendingBalance / 100,
        currency: currency.toUpperCase(),
      },
    }
  } catch (error: any) {
    console.error("[v0] Error fetching Stripe balance:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtiene el historial de payouts del vendedor
 */
export async function getPayoutHistory(limit = 10) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    // Obtener cuenta de Stripe del vendedor
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!userData || !userData.stripe_account_verified || !userData.stripe_connect_account_id) {
      return {
        success: false,
        error: "Necesitas completar la configuración de tu cuenta de Stripe",
        needsOnboarding: true,
      }
    }

    // Obtener payouts de Stripe
    const payouts = await stripe.payouts.list(
      {
        limit,
      },
      {
        stripeAccount: userData.stripe_connect_account_id,
      }
    )

    const formattedPayouts = payouts.data.map((payout) => ({
      id: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency.toUpperCase(),
      status: payout.status,
      arrivalDate: payout.arrival_date,
      createdDate: payout.created,
      description: payout.description || "Pago automático",
    }))

    return {
      success: true,
      data: formattedPayouts,
    }
  } catch (error: any) {
    console.error("[v0] Error fetching payout history:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtiene estadísticas completas del vendedor combinando datos locales y de Stripe
 */
export async function getSellerPayoutStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    // Verificar si tiene cuenta de Stripe Connect
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    // Si no tiene cuenta, devolver solo estadísticas locales
    if (!userData || !userData.stripe_connect_account_id) {
      const accountResult = await getOrCreateStripeAccount(user.id, user.email!)
      if (!accountResult.success) {
        return {
          success: false,
          error: "Error al crear cuenta de Stripe",
          needsSetup: true,
        }
      }

      return {
        success: true,
        needsOnboarding: true,
        accountId: accountResult.accountId,
        data: {
          totalEarnings: 0,
          availableBalance: 0,
          pendingBalance: 0,
          orderCount: 0,
          recentPayouts: [],
        },
      }
    }

    // Si tiene cuenta pero no completó onboarding
    if (!userData.stripe_account_verified) {
      return {
        success: true,
        needsOnboarding: true,
        accountId: userData.stripe_connect_account_id,
        data: {
          totalEarnings: 0,
          availableBalance: 0,
          pendingBalance: 0,
          orderCount: 0,
          recentPayouts: [],
        },
      }
    }

    // Obtener órdenes del vendedor de la base de datos local
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        *,
        order:orders(
          id,
          status,
          total_amount,
          created_at,
          payment_intent_id
        )
      `)
      .eq("seller_id", user.id)
      .in("order.status", ["paid", "shipped", "delivered"])

    const totalEarnings =
      orderItems?.reduce((sum, item) => {
        return sum + item.price_at_purchase * item.quantity
      }, 0) || 0

    // Obtener balance de Stripe
    const balanceResult = await getStripeBalance()
    const balance = balanceResult.success && balanceResult.data 
      ? balanceResult.data 
      : { available: 0, pending: 0, currency: "USD" }

    // Obtener historial de payouts
    const payoutsResult = await getPayoutHistory(5)
    const recentPayouts = payoutsResult.success && payoutsResult.data 
      ? payoutsResult.data 
      : []

    return {
      success: true,
      needsOnboarding: false,
      data: {
        totalEarnings,
        availableBalance: balance?.available || 0,
        pendingBalance: balance?.pending || 0,
        currency: balance?.currency || "USD",
        orderCount: orderItems?.length || 0,
        recentPayouts,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error in getSellerPayoutStats:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtiene la configuración del calendario de pagos
 */
export async function getPayoutSchedule() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!userData || !userData.stripe_account_verified || !userData.stripe_connect_account_id) {
      return {
        success: false,
        error: "Necesitas completar la configuración de tu cuenta de Stripe",
        needsOnboarding: true,
      }
    }

    // Obtener información de la cuenta de Stripe
    const account = await stripe.accounts.retrieve(userData.stripe_connect_account_id)

    const schedule = account.settings?.payouts?.schedule

    return {
      success: true,
      data: {
        interval: schedule?.interval || "manual",
        delayDays: schedule?.delay_days || 0,
        weeklyAnchor: schedule?.weekly_anchor,
        monthlyAnchor: schedule?.monthly_anchor,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error fetching payout schedule:", error)
    return { success: false, error: error.message }
  }
}
