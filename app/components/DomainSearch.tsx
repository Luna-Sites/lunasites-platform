import { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, Loader2, Globe, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../lib/api';

interface DomainResult {
  domain: string;
  available: boolean;
  premium?: boolean;
  premiumPrice?: number;
}

interface DomainSearchProps {
  onSelectDomain?: (domain: string) => void;
  onPurchase?: (domain: string) => void;
  showPurchaseButton?: boolean;
}

// Base prices for TLDs (approximate Namecheap prices in EUR) + €2 markup
const TLD_PRICES: Record<string, number> = {
  '.com': 12,
  '.net': 14,
  '.org': 14,
  '.io': 35,
  '.co': 28,
  '.app': 16,
  '.dev': 14,
  '.site': 4,
};

const MARKUP = 2; // €2 service fee

function getDomainPrice(domain: string, premiumPrice?: number): number {
  if (premiumPrice && premiumPrice > 0) {
    return premiumPrice + MARKUP;
  }
  const tld = '.' + domain.split('.').pop();
  return (TLD_PRICES[tld] || 15) + MARKUP;
}

export function DomainSearch({ onSelectDomain, onPurchase, showPurchaseButton = true }: DomainSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // TLDs to check
  const popularTlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.site'];

  // Debounced search
  const searchDomains = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    // Clean the query
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user entered a full domain (with TLD)
      const hasTld = query.includes('.');

      let domainsToCheck: string[];
      if (hasTld) {
        // User entered full domain, check just that one
        domainsToCheck = [query.toLowerCase().trim()];
      } else {
        // Generate variations with popular TLDs
        domainsToCheck = popularTlds.map(tld => `${cleanQuery}${tld}`);
      }

      const response = await api.checkDomainsAvailability(domainsToCheck);
      setResults(response.domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check domains');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDomains(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchDomains]);

  const handleSelect = (domain: string) => {
    setSelectedDomain(domain);
    onSelectDomain?.(domain);
  };

  const handlePurchase = (domain: string) => {
    onPurchase?.(domain);
  };

  const availableDomains = results.filter(r => r.available);
  const unavailableDomains = results.filter(r => !r.available);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search for a domain name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {/* Available Domains */}
          {availableDomains.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Available
              </h4>
              {availableDomains.map((result) => (
                <div
                  key={result.domain}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedDomain === result.domain
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-green-200 bg-green-50 hover:border-green-300'
                  }`}
                  onClick={() => handleSelect(result.domain)}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-slate-900">{result.domain}</span>
                    {result.premium && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${result.premium ? 'text-amber-700' : 'text-slate-700'}`}>
                      €{getDomainPrice(result.domain, result.premiumPrice)}/yr
                    </span>
                    {showPurchaseButton && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(result.domain);
                        }}
                        className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3]"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Buy
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unavailable Domains */}
          {unavailableDomains.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                Taken
              </h4>
              {unavailableDomains.map((result) => (
                <div
                  key={result.domain}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-500 line-through">{result.domain}</span>
                  </div>
                  <span className="text-sm text-slate-400">Not available</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {searchQuery.length >= 2 && !loading && results.length === 0 && !error && (
        <div className="text-center py-8 text-slate-500">
          <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No domains found. Try a different search.</p>
        </div>
      )}

      {/* Initial State */}
      {searchQuery.length < 2 && results.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Enter a domain name to check availability</p>
          <p className="text-sm mt-1">e.g., mybusiness, mystore.com</p>
        </div>
      )}
    </div>
  );
}

export default DomainSearch;
