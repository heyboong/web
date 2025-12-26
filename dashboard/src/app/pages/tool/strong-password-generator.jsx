import { useState, useCallback, useEffect } from 'react';
import { Card, Button, Badge } from 'components/ui';
import { Input, Checkbox } from 'components/ui/Form';
import { 
  ClipboardDocumentIcon,
  CheckIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import { useAuthContext } from 'app/contexts/auth/context';

export default function StrongPasswordGenerator() {
  const { user } = useAuthContext();
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false
  });

  // Track tool usage when component mounts
  useEffect(() => {
    const trackToolUsage = async () => {
      try {
        console.log('📊 Tracking tool usage for strong-password-generator...');
        
        const response = await fetch('/api/tools/strong-password-generator/track-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id || null
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Tool usage tracked successfully:', result);
        } else {
          console.log('⚠️ Failed to track tool usage:', result);
        }
      } catch (error) {
        console.error('❌ Error tracking tool usage:', error);
      }
    };

    trackToolUsage();
  }, [user?.id]);

  const generatePassword = useCallback(() => {
    let charset = '';
    
    if (settings.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (settings.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (settings.includeNumbers) charset += '0123456789';
    if (settings.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (settings.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }
    
    if (settings.excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()/\\'"~,;.<>]/g, '');
    }
    
    if (charset === '') {
      setPassword('');
      return;
    }
    
    let newPassword = '';
    for (let i = 0; i < settings.length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setPassword(newPassword);
  }, [settings]);

  const copyToClipboard = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Very Weak', color: 'error' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'error' };
    if (score <= 4) return { score, label: 'Medium', color: 'warning' };
    if (score <= 5) return { score, label: 'Strong', color: 'success' };
    return { score, label: 'Very Strong', color: 'success' };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
                    to="/dashboards/home" 
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Tools</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Strong Password Generator
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create secure passwords with customizable options
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Password Output */}
          <Card className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Generated Password
            </h2>
            
            <div className="space-y-6">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  readOnly
                  className="pr-20 text-lg font-mono bg-gray-50 dark:bg-gray-800"
                  placeholder="Your password will appear here..."
                />
                <Button
                  size="sm"
                  variant="plain"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Strength:</span>
                  <Badge color={strength.color} className="px-3 py-1">
                    {strength.label}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Length: {password.length}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={generatePassword}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                  disabled={!settings.includeUppercase && !settings.includeLowercase && !settings.includeNumbers && !settings.includeSymbols}
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Generate New Password
                </Button>
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  disabled={!password}
                  className={`px-4 ${copied ? 'text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {copied && (
                <div className="text-sm text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  Password copied to clipboard!
                </div>
              )}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Password Settings
            </h2>
            
            <div className="space-y-6">
              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Password Length: {settings.length}
                </label>
                <Input
                  type="number"
                  min={4}
                  max={50}
                  value={settings.length}
                  onChange={(e) => setSettings(prev => ({ ...prev, length: parseInt(e.target.value) || 4 }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Range: 4-50 characters
                </div>
              </div>

              {/* Character Types */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Character Types
                </h3>
                
                <div className="space-y-3">
                  <Checkbox
                    checked={settings.includeUppercase}
                    onChange={(checked) => setSettings(prev => ({ ...prev, includeUppercase: checked }))}
                    label="Uppercase letters (A-Z)"
                  />
                  <Checkbox
                    checked={settings.includeLowercase}
                    onChange={(checked) => setSettings(prev => ({ ...prev, includeLowercase: checked }))}
                    label="Lowercase letters (a-z)"
                  />
                  <Checkbox
                    checked={settings.includeNumbers}
                    onChange={(checked) => setSettings(prev => ({ ...prev, includeNumbers: checked }))}
                    label="Numbers (0-9)"
                  />
                  <Checkbox
                    checked={settings.includeSymbols}
                    onChange={(checked) => setSettings(prev => ({ ...prev, includeSymbols: checked }))}
                    label="Symbols (!@#$%^&*)"
                  />
                </div>
              </div>

              {/* Exclusions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exclusions
                </h3>
                
                <div className="space-y-3">
                  <Checkbox
                    checked={settings.excludeSimilar}
                    onChange={(checked) => setSettings(prev => ({ ...prev, excludeSimilar: checked }))}
                    label="Exclude similar characters (i, l, 1, L, o, 0, O)"
                  />
                  <Checkbox
                    checked={settings.excludeAmbiguous}
                    onChange={(checked) => setSettings(prev => ({ ...prev, excludeAmbiguous: checked }))}
                    label={"Exclude ambiguous characters ({ } [ ] ( ) / \\\\ &apos; &quot; ~ , ; . &lt; &gt;)"}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Security Tips */}
        <Card className="p-8">
          <div className="flex items-start space-x-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Security Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Use passwords that are at least 12 characters long</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Include a mix of uppercase, lowercase, numbers, and symbols</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Don&apos;t reuse passwords across different accounts</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Consider using a password manager to store your passwords securely</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Enable two-factor authentication when available</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <span>Change passwords regularly, especially for sensitive accounts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
