'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface StoreSettings {
  id: string
  user_id: string
  store_name: string
  store_slug: string
  store_description: string | null
  logo_url: string | null
  banner_url: string | null
  business_name: string | null
  business_email: string | null
  business_phone: string | null
  flat_shipping_rate: number
  free_shipping_threshold: number | null
  ships_from_zip: string | null
  ships_from_city: string | null
  ships_from_state: string | null
  processing_days: number
  return_policy: string | null
  shipping_policy: string | null
  terms_of_service: string | null
  is_active: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

interface StoreSettingsClientProps {
  initialSettings: StoreSettings | null
}

export default function StoreSettingsClient({ initialSettings }: StoreSettingsClientProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [flatShippingRate, setFlatShippingRate] = useState('5.00')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('')
  const [shipsFromZip, setShipsFromZip] = useState('')
  const [shipsFromCity, setShipsFromCity] = useState('')
  const [shipsFromState, setShipsFromState] = useState('')
  const [processingDays, setProcessingDays] = useState('2')
  const [returnPolicy, setReturnPolicy] = useState('')
  const [shippingPolicy, setShippingPolicy] = useState('')
  const [termsOfService, setTermsOfService] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')

  useEffect(() => {
    if (initialSettings) {
      setStoreName(initialSettings.store_name)
      setStoreSlug(initialSettings.store_slug)
      setStoreDescription(initialSettings.store_description || '')
      setLogoUrl(initialSettings.logo_url || '')
      setBannerUrl(initialSettings.banner_url || '')
      setBusinessName(initialSettings.business_name || '')
      setBusinessEmail(initialSettings.business_email || '')
      setBusinessPhone(initialSettings.business_phone || '')
      setFlatShippingRate(initialSettings.flat_shipping_rate.toString())
      setFreeShippingThreshold(initialSettings.free_shipping_threshold?.toString() || '')
      setShipsFromZip(initialSettings.ships_from_zip || '')
      setShipsFromCity(initialSettings.ships_from_city || '')
      setShipsFromState(initialSettings.ships_from_state || '')
      setProcessingDays(initialSettings.processing_days.toString())
      setReturnPolicy(initialSettings.return_policy || '')
      setShippingPolicy(initialSettings.shipping_policy || '')
      setTermsOfService(initialSettings.terms_of_service || '')
      setIsActive(initialSettings.is_active)
      setSeoTitle(initialSettings.seo_title || '')
      setSeoDescription(initialSettings.seo_description || '')
    }
  }, [initialSettings])

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    if (type === 'logo') {
      setUploadingLogo(true)
    } else {
      setUploadingBanner(true)
    }
    setError(null)

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      if (type === 'logo') {
        setLogoUrl(data.url)
      } else {
        setBannerUrl(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingBanner(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const url = '/api/store-settings'
      const method = initialSettings ? 'PATCH' : 'POST'

      const body = {
        store_name: storeName,
        store_slug: storeSlug,
        store_description: storeDescription || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        business_name: businessName || null,
        business_email: businessEmail || null,
        business_phone: businessPhone || null,
        flat_shipping_rate: parseFloat(flatShippingRate),
        free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        ships_from_zip: shipsFromZip || null,
        ships_from_city: shipsFromCity || null,
        ships_from_state: shipsFromState || null,
        processing_days: parseInt(processingDays),
        return_policy: returnPolicy || null,
        shipping_policy: shippingPolicy || null,
        terms_of_service: termsOfService || null,
        is_active: isActive,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save store settings')
      }

      setSuccess('Store settings saved successfully')
      router.refresh()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save store settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Store Settings</span>
          </h1>
          <p className="text-slate-400">Configure your storefront and policies</p>
        </div>

        {isActive && (
          <div className="mb-6 p-4 rounded-xl bg-profit-500/10 border border-profit-500/30 animate-slide-down" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-profit-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-profit-400 font-medium">Your store is live!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Visit your storefront at: <span className="text-slate-300">/store/{storeSlug}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Store Identity</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-slate-300 mb-2">
                  Store Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="Cali Deals"
                />
              </div>

              <div>
                <label htmlFor="storeSlug" className="block text-sm font-medium text-slate-300 mb-2">
                  Store URL Slug <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">/store/</span>
                  <input
                    id="storeSlug"
                    type="text"
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="cali"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label htmlFor="storeDescription" className="block text-sm font-medium text-slate-300 mb-2">
                  Store Description
                </label>
                <textarea
                  id="storeDescription"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="Quality resale items at great prices"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Store Logo
                  </label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                    className="hidden"
                  />
                  {logoUrl ? (
                    <div className="relative group">
                      <img
                        src={logoUrl}
                        alt="Store logo"
                        className="w-full h-32 object-contain rounded-lg bg-slate-800/50 border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute top-2 right-2 p-2 rounded bg-red-500/80 hover:bg-red-500
                                 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="w-full h-32 rounded-lg border-2 border-dashed border-slate-700
                               bg-slate-800/30 hover:bg-slate-800/50 transition-smooth
                               flex flex-col items-center justify-center gap-2
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-slate-400">
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Banner Image
                  </label>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                    className="hidden"
                  />
                  {bannerUrl ? (
                    <div className="relative group">
                      <img
                        src={bannerUrl}
                        alt="Store banner"
                        className="w-full h-32 object-cover rounded-lg bg-slate-800/50 border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="absolute top-2 right-2 p-2 rounded bg-red-500/80 hover:bg-red-500
                                 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                      className="w-full h-32 rounded-lg border-2 border-dashed border-slate-700
                               bg-slate-800/30 hover:bg-slate-800/50 transition-smooth
                               flex flex-col items-center justify-center gap-2
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-slate-400">
                        {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Business Information</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-slate-300 mb-2">
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="Your Business LLC"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessEmail" className="block text-sm font-medium text-slate-300 mb-2">
                    Business Email
                  </label>
                  <input
                    id="businessEmail"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="contact@yourbusiness.com"
                  />
                </div>

                <div>
                  <label htmlFor="businessPhone" className="block text-sm font-medium text-slate-300 mb-2">
                    Business Phone
                  </label>
                  <input
                    id="businessPhone"
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Shipping Settings</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="flatShippingRate" className="block text-sm font-medium text-slate-300 mb-2">
                    Flat Shipping Rate <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="flatShippingRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={flatShippingRate}
                      onChange={(e) => setFlatShippingRate(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="5.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-slate-300 mb-2">
                    Free Shipping Over
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="freeShippingThreshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="50.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Leave empty for no free shipping</p>
                </div>
              </div>

              <div>
                <label htmlFor="processingDays" className="block text-sm font-medium text-slate-300 mb-2">
                  Processing Time (Business Days) <span className="text-red-400">*</span>
                </label>
                <input
                  id="processingDays"
                  type="number"
                  min="0"
                  max="30"
                  value={processingDays}
                  onChange={(e) => setProcessingDays(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="shipsFromCity" className="block text-sm font-medium text-slate-300 mb-2">
                    Ships From City
                  </label>
                  <input
                    id="shipsFromCity"
                    type="text"
                    value={shipsFromCity}
                    onChange={(e) => setShipsFromCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="Rowlett"
                  />
                </div>

                <div>
                  <label htmlFor="shipsFromState" className="block text-sm font-medium text-slate-300 mb-2">
                    State
                  </label>
                  <input
                    id="shipsFromState"
                    type="text"
                    value={shipsFromState}
                    onChange={(e) => setShipsFromState(e.target.value)}
                    maxLength={2}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="TX"
                  />
                </div>

                <div>
                  <label htmlFor="shipsFromZip" className="block text-sm font-medium text-slate-300 mb-2">
                    ZIP Code
                  </label>
                  <input
                    id="shipsFromZip"
                    type="text"
                    value={shipsFromZip}
                    onChange={(e) => setShipsFromZip(e.target.value)}
                    maxLength={10}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="75088"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Store Policies</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="returnPolicy" className="block text-sm font-medium text-slate-300 mb-2">
                  Return Policy
                </label>
                <textarea
                  id="returnPolicy"
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="Returns accepted within 30 days..."
                />
              </div>

              <div>
                <label htmlFor="shippingPolicy" className="block text-sm font-medium text-slate-300 mb-2">
                  Shipping Policy
                </label>
                <textarea
                  id="shippingPolicy"
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="Orders ship within 2 business days..."
                />
              </div>

              <div>
                <label htmlFor="termsOfService" className="block text-sm font-medium text-slate-300 mb-2">
                  Terms of Service
                </label>
                <textarea
                  id="termsOfService"
                  value={termsOfService}
                  onChange={(e) => setTermsOfService(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="By purchasing, you agree to..."
                />
              </div>
            </div>
          </div>

          <details className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <summary className="cursor-pointer text-lg font-bold text-slate-100">
              SEO Settings (Optional)
            </summary>
            <div className="space-y-6 mt-6">
              <div>
                <label htmlFor="seoTitle" className="block text-sm font-medium text-slate-300 mb-2">
                  SEO Title
                </label>
                <input
                  id="seoTitle"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={60}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="Custom title for search engines"
                />
              </div>

              <div>
                <label htmlFor="seoDescription" className="block text-sm font-medium text-slate-300 mb-2">
                  SEO Description
                </label>
                <textarea
                  id="seoDescription"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="Custom description for search engines"
                />
              </div>
            </div>
          </details>

          <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">Activate Store</h3>
                <p className="text-sm text-slate-400">Make your storefront publicly visible</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-profit-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-profit-500"></div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-profit-500/10 border border-profit-500/50 rounded-xl text-profit-400 text-sm animate-fade-in">
              {success}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || uploadingLogo || uploadingBanner}
              className="flex-1 px-6 py-3 rounded-xl font-semibold
                       bg-gradient-profit text-white
                       shadow-lg shadow-profit-500/50
                       hover:shadow-glow-profit-lg hover:scale-[1.02]
                       active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-smooth"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}