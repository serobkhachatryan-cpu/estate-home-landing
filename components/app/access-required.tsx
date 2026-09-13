import { W3dsSignIn } from '@/components/app/w3ds-sign-in';

export function AccessRequired() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#ebe4d8] p-5 text-[#102030]">
      <section className="w-full max-w-sm rounded-3xl bg-[#f5f1e9] p-6 shadow-[0_18px_56px_rgba(16,32,48,0.12)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          Oriel private workspace
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#153044]">
          Sign in with your eID Wallet.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#5a6a73]">
          Oriel verifies a signature from your W3DS identity. There is no
          password and no ChatGPT account in this sign-in flow.
        </p>
        <W3dsSignIn />
        <p className="mt-4 text-center text-[11px] leading-5 text-[#7b8583]">
          Your wallet signs a one-time session request. Oriel verifies it with
          the W3DS Registry and your eVault&apos;s key-binding certificate.
        </p>
      </section>
    </main>
  );
}
