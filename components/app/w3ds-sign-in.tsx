'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ExternalLink,
  LoaderCircle,
  ScanLine,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AuthOffer = {
  uri: string;
  session: string;
  expiresAt: string;
  returnTo: string;
};

type CompletionResponse =
  | { state: 'pending' }
  | { state: 'complete' }
  | { error: string };

export function W3dsSignIn() {
  const [offer, setOffer] = useState<AuthOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!offer) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/auth/complete?session=${encodeURIComponent(offer.session)}`,
          { cache: 'no-store', credentials: 'same-origin' },
        );
        const result = (await response.json()) as CompletionResponse;
        if (cancelled) return;

        if (response.ok && 'state' in result && result.state === 'complete') {
          window.location.assign(offer.returnTo);
          return;
        }
        if (!response.ok) {
          setError(
            'This sign-in request has expired or could not be confirmed. Request a new one.',
          );
          setOffer(null);
        }
      } catch {
        if (!cancelled) {
          setError(
            'Oriel could not check the sign-in result. Please try again.',
          );
          setOffer(null);
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [offer]);

  async function requestOffer() {
    setError(null);
    setIsRequesting(true);
    try {
      const returnTo = window.location.pathname;
      const response = await fetch(
        `/api/auth/offer?return_to=${encodeURIComponent(returnTo)}`,
        { cache: 'no-store', credentials: 'same-origin' },
      );
      const result = (await response.json()) as AuthOffer | { error: string };
      if (!response.ok || !('uri' in result)) {
        throw new Error(
          'error' in result ? result.error : 'Could not start W3DS sign-in.',
        );
      }
      setOffer(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not start W3DS sign-in.',
      );
    } finally {
      setIsRequesting(false);
    }
  }

  function closeDialog() {
    setOffer(null);
  }

  return (
    <>
      <Button
        className="mt-6 h-11 w-full rounded-xl bg-[#173850] px-4 text-sm font-semibold text-white hover:bg-[#102d43]"
        disabled={isRequesting}
        onClick={() => void requestOffer()}
      >
        {isRequesting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <WalletCards className="size-4" aria-hidden="true" />
        )}
        Sign in with eID Wallet
      </Button>
      {error && (
        <p className="mt-3 rounded-xl bg-[#f8e9e5] px-3 py-2 text-xs leading-5 text-[#8a4b3a]">
          {error}
        </p>
      )}

      <Dialog
        open={Boolean(offer)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] gap-5 overflow-hidden rounded-3xl border border-[#ddd2c0] bg-[#f8f5ef] p-0 text-[#102030] shadow-[0_28px_90px_rgba(16,32,48,0.24)] sm:max-w-[29rem]">
          <div className="bg-[#173850] px-6 pt-6 pb-5 text-white">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.13em] text-[#ead9b3] uppercase">
              <ScanLine className="size-3.5" aria-hidden="true" />
              Oriel × W3DS
            </span>
            <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">
              Confirm with your eID Wallet
            </p>
          </div>

          {offer && (
            <div className="px-6 pb-1">
              <DialogHeader className="gap-3">
                <DialogTitle className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[#153044]">
                  Scan to sign in
                </DialogTitle>
                <DialogDescription className="leading-6 text-[#5a6a73]">
                  Use the W3DS eID Wallet to scan this code and sign the
                  one-time Oriel session. Your private key stays in your wallet.
                </DialogDescription>
              </DialogHeader>

              <div className="mx-auto mt-5 flex w-fit rounded-2xl border border-[#e3dacb] bg-white p-4 shadow-sm">
                <QRCodeSVG
                  bgColor="#ffffff"
                  fgColor="#153044"
                  includeMargin={false}
                  level="M"
                  size={216}
                  value={offer.uri}
                />
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-[#64747b]">
                Waiting for the wallet&apos;s signed response. This request
                expires in five minutes.
              </p>
            </div>
          )}

          <DialogFooter className="mt-1 border-[#e3dacb] bg-[#f4efe7] sm:justify-between">
            <Button
              className="text-[#5a6a73]"
              variant="ghost"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            {offer && (
              <Button
                className="h-10 rounded-xl bg-[#173850] px-4 font-semibold text-white hover:bg-[#102d43]"
                onClick={() => window.location.assign(offer.uri)}
              >
                Open eID Wallet
                <ExternalLink className="size-4" aria-hidden="true" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
