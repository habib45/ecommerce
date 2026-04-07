import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/components/seo/SEOHead';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export function FAQPage() {
  const { t } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs: FAQ[] = [
    {
      category: 'General',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various digital wallets including Apple Pay and Google Pay. All transactions are secured with SSL encryption.'
    },
    {
      category: 'General',
      question: 'How long does shipping take?',
      answer: 'Standard shipping typically takes 5-7 business days within the continental US. Express shipping options are available for 2-3 business days. International shipping may take 7-14 days depending on the destination.'
    },
    {
      category: 'General',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be unused, in original packaging, and in resalable condition. Some items like personalized products or final sale items may have different return terms. Please check our full return policy for detailed information.'
    },
    {
      category: 'Products',
      question: 'How do I know what size to order?',
      answer: 'Each product page includes a detailed size guide with measurements in inches and centimeters. We also provide customer reviews that often mention fit. If you\'re between sizes, we recommend sizing up. For personalized assistance, our customer service team can help you choose the right size.'
    },
    {
      category: 'Products',
      question: 'Are your products authentic?',
      answer: 'Yes, we guarantee the authenticity of all our products. We work directly with authorized manufacturers and distributors to ensure genuine products. Each item comes with a certificate of authenticity and a lifetime warranty against defects.'
    },
    {
      category: 'Orders',
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history. Real-time tracking is available for most shipping methods.'
    },
    {
      category: 'Orders',
      question: 'Can I cancel or modify my order?',
      answer: 'Orders can be cancelled within 1 hour of placement for a full refund. Modifications can be made within 24 hours if the order hasn\'t shipped. After shipping, please contact our customer service for assistance with any changes.'
    },
    {
      category: 'Account',
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button in the top right corner. You\'ll need to provide your email, create a password, and fill in your shipping information. Account creation takes less than a minute and gives you access to order tracking, wish lists, and personalized recommendations.'
    },
    {
      category: 'Account',
      question: 'Is my personal information secure?',
      answer: 'Absolutely. We use industry-standard SSL encryption for all data transmission. Your payment information is tokenized and never stored on our servers. We comply with GDPR and other privacy regulations and never share your information with third parties without consent.'
    },
    {
      category: 'Technical',
      question: 'What browsers do you support?',
      answer: 'Our website works best with the latest versions of Chrome, Firefox, Safari, and Edge. We also support mobile browsers on iOS and Android. For the best experience, please keep your browser updated to the latest version.'
    },
    {
      category: 'Technical',
      question: 'Why is the website loading slowly?',
      answer: 'Slow loading can be caused by various factors: internet connection speed, browser cache, or high traffic periods. Try clearing your browser cache, disabling extensions, or trying a different browser. If problems persist, our technical support team is available 24/7.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const categories = [...new Set(faqs.map(faq => faq.category))];

  return (
    <>
      <Helmet>
        <title>{t('faq.title', 'Frequently Asked Questions')}</title>
        <meta name="description" content={t('faq.description', 'Find answers to common questions about our products and services')} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {t('faq.title', 'Frequently Asked Questions')}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('faq.subtitle', 'Find answers to common questions about our products and services')}
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('faq.searchPlaceholder', 'Search for answers...')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4a4 4 0 100 4 4 0 100-4 4-4 4 0-4zm-2 0a6 6 0 100 6 6 0 100-6 6-6 6 0-6z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    searchTerm === '' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('faq.allCategories', 'All Categories')}
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSearchTerm(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchTerm === category 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">
                    {t('faq.noResults', 'No FAQs found matching your search.')}
                  </div>
                  <div className="text-gray-400 mt-2">
                    {t('faq.tryDifferentSearch', 'Try different keywords or browse all categories.')}
                  </div>
                </div>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          <div className="text-sm text-gray-500 mt-1">
                            {t('faq.category', 'Category')}: {faq.category}
                          </div>
                        </div>
                        <div className="ml-4">
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedItem === index ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.293 7.293a1 1 0 011.414 1 1 011.414-1-1-1-1 0-1-1.414 0-1-1.414 0-1-1.414 0-1-1.414 0-1-1.414 0-1-1.414-1.414 0-1-1.414 1.414 1.414 0 1.414 0 1.414 1.414 0 1.414 1.414 0 1.414-1.414 0-1.414 1.414 0 1.414 0 1.414 1.414 0 1.414 1.414 0 1.414 1.414 0 1.414 1.414 1.414 1.414 0 1.414 1.414 1.414 0 1.414z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    {expandedItem === index && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <div className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Contact Support */}
            {/* <div className="mt-12 text-center p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('faq.stillHaveQuestions', 'Still have questions?')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('faq.contactSupport', 'Our customer support team is here to help. Reach out via phone, email, or live chat.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@example.com"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  {t('faq.emailSupport', 'Email Support')}
                </a>
                <a
                  href="tel:+1-800-123-4567"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {t('faq.phoneSupport', 'Call Support')}
                </a>
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('faq.liveChat', 'Live Chat')}
                </button>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}
