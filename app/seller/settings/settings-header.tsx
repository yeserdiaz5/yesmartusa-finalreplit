"use client"

import { useLanguage } from "@/lib/i18n/LanguageContext"

export function SettingsHeader() {
  const { t } = useLanguage()

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold">{t("accountSettings")}</h1>
        <p className="text-gray-600">{t("manageStoreAndAddress")}</p>
      </div>
    </div>
  )
}
