"use client"

import SidePanel from "@modules/common/components/side-panel"
import { SizeChartPanel } from "./SizeChartPanel"

type ProductFeaturePanelProps = {
  activeFeature: string | null
  onClose: () => void
  sizeChartImageUrl?: string | null
}

export function ProductFeaturePanel({
  activeFeature,
  onClose,
  sizeChartImageUrl,
}: ProductFeaturePanelProps) {
  return (
    <SidePanel
      isOpen={!!activeFeature}
      onClose={() => onClose()}
      title={
        activeFeature === 'return' ? '3 Days Easy Return' :
          activeFeature === 'delivery' ? 'Free Shipping' :
            activeFeature === 'cod' ? 'Cash On Delivery' :
              activeFeature === 'size_chart' ? 'Size Guide' : ''
      }
    >
      {activeFeature === 'return' && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <p className="text-sm text-purple-900 leading-relaxed font-medium">
              We offer a hassle-free 3-day return policy for all our customers. If you're not satisfied with your purchase, we're here to help!
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-gray-700">1</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Unused Conditions</h4>
                <p className="text-sm text-gray-600">Items must be returned in their original condition, unused, and with all tags intact.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-gray-700">2</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Easy Process</h4>
                <p className="text-sm text-gray-600">Raise a return request from your account or contact our support team directly.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-gray-700">3</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Quick Refund</h4>
                <p className="text-sm text-gray-600">Once the quality check is completed, your refund will be processed within 24–48 hours. The amount may take a few business days to reflect in your account depending on your bank.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeFeature === 'delivery' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-900 leading-relaxed font-medium">
              Enjoy free shipping on eligible orders! We ensure your purchase reaches you safely and on time.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M12 2v20m10-10H2"></path>
                </svg>
                Order Processing
              </h4>
              <p className="text-sm text-gray-600 pl-7">Most orders are processed and dispatched within 24 hours of placement.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Average Timelines
              </h4>
              <ul className="text-sm text-gray-600 pl-7 space-y-2 list-disc">
                <li>Metro Cities: 2-3 business days</li>
                <li>Tier 2 Cities: 4-5 business days</li>
                <li>Rest of India: 5-7 business days</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Live Tracking
              </h4>
              <p className="text-sm text-gray-600 pl-7">You will receive a real-time tracking link via Email & WhatsApp once your order is shipped.</p>
            </div>
          </div>
        </div>
      )}

      {activeFeature === 'cod' && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-sm text-green-900 leading-relaxed font-medium">
              Shop with confidence! Pay only when you receive your package at your doorstep.
            </p>
          </div>
          <div className="space-y-5">
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 flex items-center justify-center bg-page-bg rounded-lg shadow-sm flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Zero Upfront Cost</h4>
                <p className="text-xs text-gray-500">No need for credit cards or online payments to place your order.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 flex items-center justify-center bg-page-bg rounded-lg shadow-sm flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Safe & Secure</h4>
                <p className="text-xs text-gray-500">Verify your package and then pay our delivery partner directly.</p>
              </div>
            </div>
            <ul className="text-xs text-gray-500 italic space-y-1 pl-4 list-disc">
              <li>Available for orders up to ₹10,000.</li>
              <li>Please keep the exact change ready for a smoother experience.</li>
              <li>Only cash payments are accepted for COD.</li>
            </ul>
          </div>
        </div>
      )}

      {activeFeature === 'size_chart' && (
        <SizeChartPanel imageUrl={sizeChartImageUrl} />
      )}
    </SidePanel>
  )
}
