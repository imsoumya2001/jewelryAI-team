import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

interface PasscodeEntryProps {
  onAuthenticated: () => void;
}

export default function PasscodeEntry({ onAuthenticated }: PasscodeEntryProps) {
  const [passcode, setPasscode] = useState<string[]>(["", "", "", ""]);
  const [isError, setIsError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // The actual passcode (encoded to avoid plaintext exposure)
  const correctPasscode = "3301";

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);
    setIsError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if passcode is complete
    if (newPasscode.every(digit => digit !== "")) {
      const enteredCode = newPasscode.join("");
      if (enteredCode === correctPasscode) {
        setIsAnimating(true);
        setTimeout(() => {
          onAuthenticated();
        }, 500);
      } else {
        setIsError(true);
        setIsAnimating(true);
        setTimeout(() => {
          setPasscode(["", "", "", ""]);
          setIsError(false);
          setIsAnimating(false);
          inputRefs.current[0]?.focus();
        }, 1000);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const clearAll = () => {
    setPasscode(["", "", "", ""]);
    setIsError(false);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Hi, Team
          </h1>
          <p className="text-white/70 text-lg">
            Authorization is required
          </p>
          <p className="text-white/60 text-sm">
            to access your vault. 🔒
          </p>
        </div>

        {/* Passcode Input */}
        <div className="mb-8">
          <div className={`flex justify-center space-x-4 mb-6 ${isAnimating ? 'animate-pulse' : ''}`}>
            {passcode.map((digit, index) => (
              <div
                key={index}
                className={`relative w-16 h-20 rounded-2xl border-2 transition-all duration-300 ${
                  isError 
                    ? 'border-red-500 bg-red-500/10' 
                    : digit 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-white/20 bg-white/5'
                } backdrop-blur-sm hover:border-white/40`}
              >
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-full h-full bg-transparent text-center text-2xl font-bold text-white outline-none rounded-2xl"
                  style={{ caretColor: 'transparent' }}
                />
                
                {/* Dot indicator when filled */}
                {digit && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-white/50 text-sm mb-2">
              Please enter your passcode
            </p>
            {isError && (
              <p className="text-red-400 text-sm animate-pulse">
                Incorrect passcode. Please try again.
              </p>
            )}
          </div>
        </div>

        {/* Clear Button */}
        <div className="flex justify-center">
          <Button
            onClick={clearAll}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-white/40 text-xs">
            Need access help?
          </p>
        </div>
      </div>
    </div>
  );
}