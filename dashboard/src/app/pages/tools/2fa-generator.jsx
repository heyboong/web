import { useState, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Badge } from 'components/ui';
import { 
  ClipboardDocumentIcon,
  CheckIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useThemeContext } from "app/contexts/theme/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";

// TOTP Algorithm - Google Authenticator compatible
class TOTPGenerator {
  constructor(secret) {
    this.secret = secret.replace(/\s/g, '').toUpperCase();
  }

  // Base32 decode
  base32Decode(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    for (let i = 0; i < base32.length; i++) {
      const val = alphabet.indexOf(base32.charAt(i));
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }
    
    return bytes;
  }

  // HMAC-SHA1
  async hmacSha1(key, message) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  }

  // Generate TOTP code
  async generate(timeStep = 30) {
    try {
      const epoch = Math.floor(Date.now() / 1000);
      let time = Math.floor(epoch / timeStep);
      
      // Convert time to 8-byte array
      const timeBytes = new Uint8Array(8);
      for (let i = 7; i >= 0; i--) {
        timeBytes[i] = time & 0xff;
        time >>= 8;
      }
      
      // Decode secret
      const keyBytes = this.base32Decode(this.secret);
      
      // Generate HMAC
      const hmac = await this.hmacSha1(keyBytes, timeBytes);
      
      // Dynamic truncation
      const offset = hmac[hmac.length - 1] & 0x0f;
      const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000;
      
      return code.toString().padStart(6, '0');
    } catch {
      throw new Error('Invalid 2FA secret');
    }
  }

  // Get remaining seconds until next code
  getRemainingSeconds(timeStep = 30) {
    const epoch = Math.floor(Date.now() / 1000);
    return timeStep - (epoch % timeStep);
  }
}

export default function TwoFAGenerator() {
  const { isDark } = useThemeContext();
  const [secrets, setSecrets] = useState('');
  const [codes, setCodes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Auto-refresh codes every second
  useEffect(() => {
    if (codes.length === 0) return;

    const interval = setInterval(async () => {
      const newCodes = [];
      const secretLines = secrets.split('\n').filter(s => s.trim());
      
      for (const secret of secretLines) {
        try {
          const generator = new TOTPGenerator(secret.trim());
          const code = await generator.generate();
          const remaining = generator.getRemainingSeconds();
          
          newCodes.push({
            secret: secret.trim(),
            code,
            remaining,
            error: null
          });
        } catch {
          newCodes.push({
            secret: secret.trim(),
            code: null,
            remaining: 0,
            error: 'Invalid secret'
          });
        }
      }
      
      setCodes(newCodes);
      if (newCodes.length > 0) {
        setRemainingSeconds(newCodes[0].remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codes.length, secrets]);

  const generateCodes = async () => {
    if (!secrets.trim()) {
      toast.error('Please enter at least one 2FA secret key');
      return;
    }

    setIsGenerating(true);
    const secretLines = secrets.split('\n').filter(s => s.trim());
    const newCodes = [];

    for (const secret of secretLines) {
      try {
        const generator = new TOTPGenerator(secret.trim());
        const code = await generator.generate();
        const remaining = generator.getRemainingSeconds();
        
        newCodes.push({
          secret: secret.trim(),
          code,
          remaining,
          error: null
        });
      } catch {
        newCodes.push({
          secret: secret.trim(),
          code: null,
          remaining: 0,
          error: 'Invalid secret key'
        });
      }
    }

    setCodes(newCodes);
    setIsGenerating(false);
    
    if (newCodes.every(c => c.error)) {
      toast.error('All secrets are invalid');
    } else {
      toast.success(`Generated ${newCodes.filter(c => !c.error).length} codes`);
    }
  };

  const copyCode = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  return (
    <SubscriptionGuard>
      <Page title="2FA Code Generator">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                2FA Code Generator
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate OTP codes for two-factor authentication - Compatible with Google Authenticator
              </p>
            </div>

            {/* Input Section */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    2FA Secret Keys *
                  </label>
                  <textarea
                    value={secrets}
                    onChange={(e) => setSecrets(e.target.value)}
                    placeholder="Enter your 2FA secret keys (one per line)&#10;Example:&#10;JBSWY3DPEHPK3PXP&#10;HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ"
                    className={`w-full h-40 px-4 py-3 border rounded-lg font-mono text-sm resize-y ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    💡 <strong>Store your 2FA secrets safely!</strong> Enter one secret per line. Each secret will generate a unique 6-digit code.
                  </div>
                </div>

                <Button
                  onClick={generateCodes}
                  disabled={isGenerating || !secrets.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="h-5 w-5 mr-2" />
                      Get Codes
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Codes Display */}
            {codes.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Generated Codes ({codes.filter(c => !c.error).length}/{codes.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      Refreshes in: <strong className={remainingSeconds <= 5 ? 'text-red-500' : 'text-blue-600'}>{remainingSeconds}s</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Secret Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          OTP Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Time Left
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
                      {codes.map((item, index) => (
                        <tr key={index} className={isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                              {item.secret.substring(0, 8)}...
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.error ? (
                              <Badge color="danger">{item.error}</Badge>
                            ) : (
                              <div className="font-mono text-2xl font-bold text-gray-900 dark:text-white tracking-wider">
                                {item.code?.substring(0, 3)} {item.code?.substring(3, 6)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!item.error && (
                              <div className="flex items-center gap-2">
                                <div className="relative w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`absolute h-full transition-all duration-1000 ${
                                      item.remaining <= 5 ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${(item.remaining / 30) * 100}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-mono ${
                                  item.remaining <= 5 ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {item.remaining}s
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {!item.error && (
                              <Button
                                size="sm"
                                variant="outlined"
                                onClick={() => copyCode(item.code, index)}
                                className={copiedIndex === index ? 'border-green-500 text-green-600' : ''}
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <CheckIcon className="h-4 w-4 mr-1" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Info & Tips */}
            <Card className="p-6">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    How to Use
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• <strong>2FA Secret</strong> is the base32 encoded key (usually 16-32 characters)</li>
                    <li>• Codes are <strong>6 digits</strong> and refresh every <strong>30 seconds</strong></li>
                    <li>• Compatible with <strong>Google Authenticator</strong>, Authy, Microsoft Authenticator</li>
                    <li>• Enter multiple secrets (one per line) to generate codes in batch</li>
                    <li>• <strong className="text-red-600">⚠️ Keep your secrets safe!</strong> Anyone with your secret can generate codes</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Sample Secrets (Hidden by default) */}
            <Card className="p-6">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  📝 Show Example Secrets (for testing)
                </summary>
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <code className="text-xs font-mono text-gray-600 dark:text-gray-400 block whitespace-pre">
JBSWY3DPEHPK3PXP
HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ
GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
                  </code>
                  <button
                    onClick={() => setSecrets('JBSWY3DPEHPK3PXP\nHXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ\nGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Click to use these examples
                  </button>
                </div>
              </details>
            </Card>
          </div>
        </div>
      </Page>
    </SubscriptionGuard>
  );
}
